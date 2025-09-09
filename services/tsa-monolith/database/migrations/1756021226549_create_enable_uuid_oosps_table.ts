import { BaseSchema } from '@adonisjs/lucid/schema'

export default class EnableUuidOssp extends BaseSchema {
  protected tableName = ''

  public async up() {
    await this.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
  }

  public async down() {
    await this.schema.raw('DROP EXTENSION IF EXISTS "uuid-ossp";')
  }
}
