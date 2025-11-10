import db from '@adonisjs/lucid/services/db'

async function checkOrderItemsSchema() {
  try {
    // Vérifier la structure de la table order_items
    const columns = await db.rawQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position;
    `)

    console.log('📋 Structure de la table order_items:')
    console.table(columns.rows)

    // Vérifier si la colonne total_price existe
    const hasTotalPrice = columns.rows.some((col: any) => col.column_name === 'total_price')

    if (hasTotalPrice) {
      console.log('✅ La colonne total_price existe')
    } else {
      console.log("❌ La colonne total_price n'existe PAS")
      console.log(
        '📝 Colonnes disponibles:',
        columns.rows.map((c: any) => c.column_name)
      )
    }

    // Compter les enregistrements
    const count = await db.from('order_items').count('* as total')
    console.log(`\n📊 Nombre d'order_items: ${count[0].total}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

checkOrderItemsSchema()
