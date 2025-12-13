import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      CREATE TYPE document_status AS ENUM ('pending', 'validated', 'rejected', 'expired', 'replaced')
    `)
  }

  async down() {
    this.schema.raw('DROP TYPE IF EXISTS document_status')
  }
}
