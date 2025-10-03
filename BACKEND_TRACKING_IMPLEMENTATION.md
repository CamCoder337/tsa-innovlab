# 🚀 TSA Tracking Backend - Guide d'Implémentation

## 📋 Vue d'Ensemble

Ce document détaille l'implémentation complète du système de tracking temps réel pour TSA Logistics utilisant **AdonisJS v6 + PostgreSQL/PostGIS + WebSocket**.

## 🛠️ Stack Technique

- **Framework**: AdonisJS v6
- **Base de données**: PostgreSQL + PostGIS
- **Temps réel**: WebSocket natif
- **APIs externes**: Google Distance Matrix API
- **Cache**: Redis (optionnel)

## 📦 Dépendances à Installer

```bash
# Extensions PostgreSQL/PostGIS
npm install pg @types/pg
npm install @adonisjs/lucid

# WebSocket
npm install ws @types/ws

# Google APIs
npm install @google/maps

# Validation et utilitaires
npm install @adonisjs/validator
npm install luxon
```

## 🗄️ Configuration Base de Données

### 1. Extension PostGIS

```sql
-- À exécuter dans votre base PostgreSQL
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

### 2. Migration Principale

```typescript
// database/migrations/001_create_vehicle_tracking.ts
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class VehicleTrackings extends BaseSchema {
  protected tableName = 'vehicle_trackings'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.string('vehicle_id', 50).notNullable()
      table.string('mission_id', 50).nullable()
      table.string('driver_id', 50).nullable()
      
      // Colonnes géospatiales PostGIS
      table.specificType('position', 'GEOMETRY(POINT, 4326)').notNullable()
      table.float('altitude').nullable()
      table.float('speed').nullable() // km/h
      table.float('bearing').nullable() // 0-360 degrés
      table.float('accuracy').nullable() // mètres
      
      // Métadonnées
      table.integer('battery_level').nullable() // %
      table.boolean('is_active').defaultTo(true)
      table.json('metadata').nullable()
      
      table.timestamp('timestamp', { useTz: true }).defaultTo(this.now())
      table.timestamps(true)
      
      // Index composé ultra-performant
      table.index(['vehicle_id', 'timestamp'])
    })
    
    // Index spatial PostGIS
    this.defer(async (db) => {
      await db.rawQuery('CREATE INDEX idx_vehicle_trackings_position ON vehicle_trackings USING GIST (position)')
      await db.rawQuery('CREATE INDEX idx_vehicle_trackings_composite ON vehicle_trackings USING GIST (vehicle_id, position, timestamp DESC)')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### 3. Migration Géofences

```typescript
// database/migrations/002_create_geofences.ts
export default class Geofences extends BaseSchema {
  protected tableName = 'geofences'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 100).notNullable()
      table.specificType('zone', 'GEOMETRY(POLYGON, 4326)').notNullable()
      table.enum('type', ['warehouse', 'delivery_zone', 'restricted', 'checkpoint']).notNullable()
      table.json('properties').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamps(true)
    })
    
    this.defer(async (db) => {
      await db.rawQuery('CREATE INDEX idx_geofences_zone ON geofences USING GIST (zone)')
    })
  }
}
```

### 4. Vue Matérialisée Optimisée

```sql
-- À créer après les migrations
CREATE MATERIALIZED VIEW latest_vehicle_positions AS
SELECT DISTINCT ON (vehicle_id)
    id,
    vehicle_id,
    mission_id,
    driver_id,
    position,
    speed,
    bearing,
    battery_level,
    timestamp
FROM vehicle_trackings
WHERE is_active = true
ORDER BY vehicle_id, timestamp DESC;

CREATE UNIQUE INDEX idx_latest_positions_vehicle ON latest_vehicle_positions (vehicle_id);
CREATE INDEX idx_latest_positions_geom ON latest_vehicle_positions USING GIST (position);
```

## 📝 Modèles AdonisJS

### 1. Modèle VehicleTracking

```typescript
// app/Models/VehicleTracking.ts
import { BaseModel, column, computed } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

export default class VehicleTracking extends BaseModel {
  public static table = 'vehicle_trackings'

  @column({ isPrimary: true })
  public id: number

  @column()
  public vehicleId: string

  @column()
  public missionId: string | null

  @column()
  public driverId: string | null

  @column({
    serialize: (value) => {
      if (value && value.coordinates) {
        return {
          lat: value.coordinates[1],
          lng: value.coordinates[0]
        }
      }
      return null
    }
  })
  public position: any

  @column()
  public speed: number | null

  @column()
  public bearing: number | null

  @column()
  public accuracy: number | null

  @column()
  public batteryLevel: number | null

  @column()
  public isActive: boolean

  @column()
  public metadata: any

  @column.dateTime()
  public timestamp: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // Méthodes statiques pour requêtes géospatiales
  public static async savePosition(data: {
    vehicleId: string
    lat: number
    lng: number
    speed?: number
    bearing?: number
    accuracy?: number
    batteryLevel?: number
    missionId?: string
    driverId?: string
  }) {
    const position = `POINT(${data.lng} ${data.lat})`
    
    return await this.create({
      vehicleId: data.vehicleId,
      missionId: data.missionId,
      driverId: data.driverId,
      position: Database.rawQuery('ST_GeomFromText(?, 4326)', [position]),
      speed: data.speed,
      bearing: data.bearing,
      accuracy: data.accuracy,
      batteryLevel: data.batteryLevel,
      timestamp: DateTime.now()
    })
  }

  public static async findNearby(lat: number, lng: number, radiusKm: number = 5) {
    const query = `
      SELECT 
        vehicle_id,
        mission_id,
        driver_id,
        ST_AsGeoJSON(position) as coordinates,
        speed,
        bearing,
        battery_level,
        timestamp,
        ST_Distance(position::geography, ST_MakePoint($2, $1)::geography) / 1000 as distance_km
      FROM latest_vehicle_positions
      WHERE ST_DWithin(position::geography, ST_MakePoint($2, $1)::geography, $3)
      ORDER BY distance_km
    `
    
    const result = await Database.rawQuery(query, [lat, lng, radiusKm * 1000])
    return result.rows
  }

  public static async getVehicleTrajectory(vehicleId: string, hours: number = 24) {
    const query = `
      SELECT 
        vehicle_id,
        ST_AsGeoJSON(ST_MakeLine(position ORDER BY timestamp)) as trajectory,
        COUNT(*) as points_count,
        ST_Length(ST_MakeLine(position ORDER BY timestamp)::geography) / 1000 as distance_km,
        MIN(timestamp) as start_time,
        MAX(timestamp) as end_time
      FROM vehicle_trackings 
      WHERE vehicle_id = $1 
        AND timestamp >= NOW() - INTERVAL '${hours} hours'
        AND is_active = true
      GROUP BY vehicle_id
    `
    
    const result = await Database.rawQuery(query, [vehicleId])
    return result.rows[0] || null
  }
}
```

## 🔌 WebSocket Server

### 1. Configuration WebSocket

```typescript
// start/socket.ts
import { Server } from 'socket.io'
import AdonisServer from '@ioc:Adonis/Core/Server'

class SocketService {
  private io: Server
  private vehicleRooms = new Map<string, Set<string>>()

  public boot() {
    this.io = new Server(AdonisServer.instance!, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // Rejoindre une room de véhicule
      socket.on('join_vehicle', (vehicleId: string) => {
        socket.join(`vehicle_${vehicleId}`)
        
        if (!this.vehicleRooms.has(vehicleId)) {
          this.vehicleRooms.set(vehicleId, new Set())
        }
        this.vehicleRooms.get(vehicleId)!.add(socket.id)
      })

      // Recevoir position GPS
      socket.on('position_update', async (data) => {
        try {
          await this.handlePositionUpdate(socket, data)
        } catch (error) {
          socket.emit('error', { message: 'Failed to process position update' })
        }
      })

      // Déconnexion
      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })
    })
  }

  private async handlePositionUpdate(socket: any, data: any) {
    const { vehicleId, lat, lng, speed, bearing, accuracy, batteryLevel } = data

    // Sauvegarder en base
    const VehicleTracking = (await import('App/Models/VehicleTracking')).default
    await VehicleTracking.savePosition({
      vehicleId,
      lat,
      lng,
      speed,
      bearing,
      accuracy,
      batteryLevel
    })

    // Broadcaster aux clients intéressés
    this.io.to(`vehicle_${vehicleId}`).emit('position_updated', {
      vehicleId,
      position: { lat, lng },
      speed,
      bearing,
      timestamp: new Date().toISOString()
    })

    // Rafraîchir vue matérialisée (async)
    this.refreshMaterializedView()
  }

  private handleDisconnect(socket: any) {
    this.vehicleRooms.forEach((clients, vehicleId) => {
      clients.delete(socket.id)
      if (clients.size === 0) {
        this.vehicleRooms.delete(vehicleId)
      }
    })
  }

  private async refreshMaterializedView() {
    const Database = (await import('@ioc:Adonis/Lucid/Database')).default
    await Database.rawQuery('REFRESH MATERIALIZED VIEW CONCURRENTLY latest_vehicle_positions')
  }

  public broadcastToVehicle(vehicleId: string, event: string, data: any) {
    this.io.to(`vehicle_${vehicleId}`).emit(event, data)
  }
}

export default new SocketService()
```

## 🎯 Contrôleurs API

### 1. TrackingController

```typescript
// app/Controllers/Http/TrackingController.ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import VehicleTracking from 'App/Models/VehicleTracking'
import ETAService from 'App/Services/ETAService'

export default class TrackingController {
  // Obtenir position actuelle d'un véhicule
  public async getCurrentPosition({ params, response }: HttpContextContract) {
    try {
      const { vehicleId } = params
      
      const position = await VehicleTracking
        .query()
        .where('vehicle_id', vehicleId)
        .where('is_active', true)
        .orderBy('timestamp', 'desc')
        .first()

      if (!position) {
        return response.notFound({ message: 'Vehicle not found or inactive' })
      }

      return response.ok(position)
    } catch (error) {
      return response.internalServerError({ message: 'Failed to get position' })
    }
  }

  // Obtenir véhicules à proximité
  public async getNearbyVehicles({ request, response }: HttpContextContract) {
    try {
      const { lat, lng, radius = 5 } = request.qs()
      
      const vehicles = await VehicleTracking.findNearby(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(radius)
      )

      return response.ok(vehicles)
    } catch (error) {
      return response.internalServerError({ message: 'Failed to find nearby vehicles' })
    }
  }

  // Obtenir trajectoire d'un véhicule
  public async getVehicleTrajectory({ params, request, response }: HttpContextContract) {
    try {
      const { vehicleId } = params
      const { hours = 24 } = request.qs()
      
      const trajectory = await VehicleTracking.getVehicleTrajectory(
        vehicleId,
        parseInt(hours)
      )

      return response.ok(trajectory)
    } catch (error) {
      return response.internalServerError({ message: 'Failed to get trajectory' })
    }
  }

  // Calculer ETA
  public async calculateETA({ request, response }: HttpContextContract) {
    try {
      const { vehicleId, destinationLat, destinationLng } = request.body()
      
      const etaService = new ETAService()
      const eta = await etaService.calculateETA(vehicleId, {
        lat: destinationLat,
        lng: destinationLng
      })

      return response.ok(eta)
    } catch (error) {
      return response.internalServerError({ message: 'Failed to calculate ETA' })
    }
  }
}
```

## 🧮 Service ETA

```typescript
// app/Services/ETAService.ts
import { Client } from '@google/maps'
import VehicleTracking from 'App/Models/VehicleTracking'
import Env from '@ioc:Adonis/Core/Env'

export default class ETAService {
  private googleMaps: Client

  constructor() {
    this.googleMaps = new Client({
      key: Env.get('GOOGLE_MAPS_API_KEY')
    })
  }

  public async calculateETA(vehicleId: string, destination: { lat: number, lng: number }) {
    // Obtenir position actuelle
    const currentPosition = await VehicleTracking
      .query()
      .where('vehicle_id', vehicleId)
      .where('is_active', true)
      .orderBy('timestamp', 'desc')
      .first()

    if (!currentPosition) {
      throw new Error('Vehicle position not found')
    }

    const origin = currentPosition.position

    // Appel Google Distance Matrix API
    const response = await this.googleMaps.distancematrix({
      params: {
        origins: [`${origin.lat},${origin.lng}`],
        destinations: [`${destination.lat},${destination.lng}`],
        departure_time: 'now',
        traffic_model: 'best_guess',
        key: Env.get('GOOGLE_MAPS_API_KEY')
      }
    })

    const element = response.data.rows[0].elements[0]

    if (element.status !== 'OK') {
      throw new Error('Unable to calculate route')
    }

    return {
      distance: element.distance,
      duration: element.duration,
      duration_in_traffic: element.duration_in_traffic,
      eta: new Date(Date.now() + element.duration_in_traffic.value * 1000),
      confidence: this.calculateConfidence(element)
    }
  }

  private calculateConfidence(element: any): number {
    // Logique de calcul de confiance basée sur trafic
    const trafficRatio = element.duration_in_traffic.value / element.duration.value
    
    if (trafficRatio <= 1.1) return 95
    if (trafficRatio <= 1.3) return 80
    if (trafficRatio <= 1.5) return 65
    return 50
  }
}
```

## 🛣️ Routes API

```typescript
// start/routes.ts
import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  // Tracking endpoints
  Route.get('/tracking/:vehicleId/position', 'TrackingController.getCurrentPosition')
  Route.get('/tracking/nearby', 'TrackingController.getNearbyVehicles')
  Route.get('/tracking/:vehicleId/trajectory', 'TrackingController.getVehicleTrajectory')
  Route.post('/tracking/eta', 'TrackingController.calculateETA')
  
}).prefix('/api/v1')
```

## ⚙️ Variables d'Environnement

```env
# .env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
FRONTEND_URL=http://localhost:3000

# Base de données avec PostGIS
DB_CONNECTION=pg
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=password
PG_DB_NAME=tsa_logistics
```

## 🚀 Démarrage

```bash
# 1. Installer dépendances
npm install

# 2. Configurer base de données
node ace migration:run

# 3. Créer vue matérialisée
psql -d tsa_logistics -f database/views/latest_positions.sql

# 4. Démarrer serveur
node ace serve --watch
```

## 📊 Monitoring et Performance

### Requêtes d'Optimisation

```sql
-- Nettoyer anciennes positions (à exécuter périodiquement)
DELETE FROM vehicle_trackings 
WHERE timestamp < NOW() - INTERVAL '30 days' 
  AND is_active = false;

-- Rafraîchir vue matérialisée (cron job)
REFRESH MATERIALIZED VIEW CONCURRENTLY latest_vehicle_positions;

-- Statistiques performance
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename = 'vehicle_trackings';
```

## 🔧 Points d'Attention

1. **Index PostGIS** : Essentiels pour performance
2. **Vue matérialisée** : Rafraîchir régulièrement
3. **Nettoyage données** : Purger anciennes positions
4. **Monitoring** : Surveiller usage Google Maps API
5. **WebSocket** : Gérer reconnexions automatiques

---

**Équipe de développement** : Ce guide couvre l'implémentation complète. Commencer par les migrations, puis les modèles, et enfin les WebSockets.
