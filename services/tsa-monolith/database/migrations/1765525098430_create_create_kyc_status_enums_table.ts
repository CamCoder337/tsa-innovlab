import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      CREATE TYPE kyc_status AS ENUM ('incomplete', 'pending', 'validated', 'rejected', 'expired', 'action_required')
    `)
  }

  async down() {
    this.schema.raw('DROP TYPE IF EXISTS kyc_status')
  }
}
