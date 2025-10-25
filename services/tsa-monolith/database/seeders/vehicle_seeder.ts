import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Vehicle from '#models/vehicle'
import { VehicleType, VehicleStatus } from '#models/vehicle'
import { UserRole } from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Récupérer tous les transporteurs
    const transporteurs = await User.query().where('role', UserRole.TRANSPORTEUR)

    if (transporteurs.length === 0) {
      console.log('⚠️  Aucun transporteur trouvé, impossible de créer des véhicules de test')
      return
    }

    console.log(`✅ Création de véhicules pour ${transporteurs.length} transporteurs...`)

    const vehiclesData = []

    // Créer 2-3 véhicules pour chaque transporteur
    for (const transporteur of transporteurs) {
      const numVehicles = Math.floor(Math.random() * 2) + 2 // 2 ou 3 véhicules

      for (let i = 0; i < numVehicles; i++) {
        const types = [VehicleType.TRUCK, VehicleType.VAN, VehicleType.MOTORCYCLE, VehicleType.CAR]
        const type = types[Math.floor(Math.random() * types.length)]

        const statuses = [
          VehicleStatus.AVAILABLE,
          VehicleStatus.AVAILABLE, // Plus de chances d'être disponible
          VehicleStatus.AVAILABLE,
          VehicleStatus.MAINTENANCE,
        ]
        const status = statuses[Math.floor(Math.random() * statuses.length)]

        // Générer une immatriculation unique
        const randomNum = Math.floor(Math.random() * 9999)
          .toString()
          .padStart(4, '0')
        const registration = `CM-${transporteur.lastName?.substring(0, 2).toUpperCase() || 'XX'}-${randomNum}`

        vehiclesData.push({
          userId: transporteur.id,
          type,
          registration,
          description: this.getVehicleDescription(type),
          status,
        })
      }
    }

    // Créer tous les véhicules
    await Vehicle.createMany(vehiclesData)

    console.log(`✅ ${vehiclesData.length} véhicules créés avec succès`)
  }

  private getVehicleDescription(type: VehicleType): string {
    const descriptions = {
      [VehicleType.TRUCK]: [
        'Camion 20 tonnes, capacité 80m³',
        'Camion frigorifique 15 tonnes',
        'Semi-remorque 40 tonnes',
      ],
      [VehicleType.VAN]: [
        'Fourgon utilitaire 3.5 tonnes',
        'Camionnette réfrigérée',
        'Van de livraison 5m³',
      ],
      [VehicleType.MOTORCYCLE]: [
        'Moto de livraison urbaine',
        'Scooter pour colis légers',
        'Moto tout-terrain',
      ],
      [VehicleType.CAR]: [
        'Berline pour transport VIP',
        'Break pour petits colis',
        'SUV pour trajets longue distance',
      ],
    }

    const options = descriptions[type]
    return options[Math.floor(Math.random() * options.length)]
  }
}
