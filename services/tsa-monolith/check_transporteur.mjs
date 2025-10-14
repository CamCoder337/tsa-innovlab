import { createPool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
})

try {
  const result = await pool.query(`
    SELECT id, email, role, status
    FROM users
    WHERE role = 'transporteur'
    LIMIT 5
  `)

  console.log('\n📊 Transporteurs dans la base :')
  console.log('================================')

  if (result.rows.length === 0) {
    console.log('❌ Aucun transporteur trouvé !')
  } else {
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`)
      console.log(`   Status: ${user.status}`)
      console.log(`   ID: ${user.id}`)
      console.log('---')
    })
  }

  await pool.end()
} catch (error) {
  console.error('❌ Erreur:', error.message)
  await pool.end()
  process.exit(1)
}
