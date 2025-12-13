/**
 * Script de diagnostic pour vérifier l'état des tables de commandes
 * Utilise les variables d'environnement pour se connecter à PostgreSQL
 *
 * Usage: node check_orders_tables.mjs
 */

import pg from 'pg'
const { Client } = pg

// Configuration de la connexion depuis .env
const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'tsa_contest',
}

const REQUIRED_TABLES = ['carts', 'cart_items', 'orders', 'order_items', 'payments']

const REQUIRED_MIGRATIONS = [
  '1759501000000_create_carts_table',
  '1759502000000_create_cart_items_table',
  '1759503000000_create_orders_table',
  '1759504000000_create_order_items_table',
  '1759505000000_create_payments_table',
]

async function checkDatabase() {
  const client = new Client(config)

  try {
    console.log('🔍 Connexion à la base de données...')
    console.log(`   Host: ${config.host}:${config.port}`)
    console.log(`   Database: ${config.database}`)
    console.log(`   User: ${config.user}\n`)

    await client.connect()
    console.log('✅ Connexion établie\n')

    // 1. Vérifier les migrations exécutées
    console.log('📊 Vérification des migrations...')
    const migrationsQuery = `
      SELECT name, batch, migration_time
      FROM adonis_schema
      WHERE name LIKE '%order%' OR name LIKE '%cart%' OR name LIKE '%payment%'
      ORDER BY migration_time DESC
    `

    const migrationsResult = await client.query(migrationsQuery)

    if (migrationsResult.rows.length === 0) {
      console.log('❌ AUCUNE migration liée aux commandes trouvée !')
      console.log('\n⚠️  LES MIGRATIONS NE SONT PAS EXÉCUTÉES EN PRODUCTION\n')
    } else {
      console.log(`✅ ${migrationsResult.rows.length} migrations trouvées :`)
      migrationsResult.rows.forEach((row) => {
        console.log(`   - ${row.name} (batch: ${row.batch}, date: ${row.migration_time})`)
      })
    }

    // Vérifier les migrations manquantes
    const executedMigrations = migrationsResult.rows.map((r) => r.name)
    const missingMigrations = REQUIRED_MIGRATIONS.filter((m) => !executedMigrations.includes(m))

    if (missingMigrations.length > 0) {
      console.log(`\n⚠️  ${missingMigrations.length} migrations MANQUANTES :`)
      missingMigrations.forEach((m) => console.log(`   - ${m}`))
    } else {
      console.log('\n✅ Toutes les migrations requises sont présentes')
    }

    // 2. Vérifier l'existence des tables
    console.log('\n📋 Vérification des tables...')
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (${REQUIRED_TABLES.map((t) => `'${t}'`).join(',')})
    `

    const tablesResult = await client.query(tablesQuery)
    const existingTables = tablesResult.rows.map((r) => r.table_name)

    REQUIRED_TABLES.forEach((table) => {
      if (existingTables.includes(table)) {
        console.log(`   ✅ Table '${table}' existe`)
      } else {
        console.log(`   ❌ Table '${table}' MANQUANTE`)
      }
    })

    // 3. Compter les enregistrements si les tables existent
    if (existingTables.includes('orders')) {
      console.log('\n📈 Statistiques des commandes...')
      const ordersCount = await client.query('SELECT COUNT(*) FROM orders')
      console.log(`   Total commandes: ${ordersCount.rows[0].count}`)

      if (parseInt(ordersCount.rows[0].count) > 0) {
        const statusQuery = `
          SELECT status, COUNT(*) as count
          FROM orders
          GROUP BY status
        `
        const statusResult = await client.query(statusQuery)
        console.log('   Répartition par statut:')
        statusResult.rows.forEach((row) => {
          console.log(`     - ${row.status}: ${row.count}`)
        })
      }
    }

    // 4. Vérifier le contrôleur compilé
    console.log('\n📦 Vérification du build...')
    const fs = await import('fs')
    const buildPath = './build/app/controllers/http/admin/orders_controller.js'

    if (fs.existsSync(buildPath)) {
      console.log('   ✅ Contrôleur orders_controller.js compilé')
    } else {
      console.log('   ❌ Contrôleur orders_controller.js MANQUANT dans le build')
      console.log('   → Lancer: npm run build')
    }

    // 5. Résumé et recommandations
    console.log('\n' + '='.repeat(60))
    console.log('📋 RÉSUMÉ ET RECOMMANDATIONS')
    console.log('='.repeat(60))

    if (missingMigrations.length > 0 || existingTables.length < REQUIRED_TABLES.length) {
      console.log('❌ PROBLÈME DÉTECTÉ: Migrations manquantes')
      console.log('\n🔧 SOLUTION:')
      console.log('   1. Connectez-vous au serveur de production')
      console.log('   2. Lancez les migrations:')
      console.log('      cd /path/to/tsa-monolith')
      console.log('      node ace migration:run --force')
      console.log('   3. Redémarrez le serveur:')
      console.log('      pm2 restart tsa-monolith')
      console.log('      OU')
      console.log('      docker-compose restart')
    } else {
      console.log('✅ Toutes les tables et migrations sont présentes')
      console.log("\n🔧 Si l'erreur persiste, vérifiez:")
      console.log('   1. Le build est à jour: npm run build')
      console.log('   2. Le serveur a été redémarré')
      console.log('   3. Les routes sont bien enregistrées dans start/routes.ts')
    }

    console.log('')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error("\n⚠️  Vérifiez vos variables d'environnement DB_*")
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Exécuter le diagnostic
checkDatabase().catch(console.error)
