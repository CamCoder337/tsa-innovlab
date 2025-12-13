import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      CREATE TYPE document_validation_action AS ENUM ('validated', 'rejected', 'expired', 'replaced', 'resubmitted', 'auto_expired')
    `)
  }

  async down() {
    this.schema.raw('DROP TYPE IF EXISTS document_validation_action')
  }
}
