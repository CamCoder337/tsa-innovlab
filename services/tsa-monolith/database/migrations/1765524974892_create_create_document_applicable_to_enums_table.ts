import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      CREATE TYPE document_applicable_to AS ENUM ('user', 'vehicle')
    `)
  }

  async down() {
    this.schema.raw('DROP TYPE IF EXISTS document_applicable_to')
  }
}
