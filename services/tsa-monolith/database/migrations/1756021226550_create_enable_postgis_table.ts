import { BaseSchema } from '@adonisjs/lucid/schema'

export default class EnablePostgis extends BaseSchema {
  protected tableName = ''

  public async up() {
    // Activation des extensions PostGIS
    await this.schema.raw('CREATE EXTENSION IF NOT EXISTS "postgis";')
    await this.schema.raw('CREATE EXTENSION IF NOT EXISTS "postgis_topology";')
  }

  public async down() {
    // Optionnel : désactiver les extensions
    await this.schema.raw('DROP EXTENSION IF EXISTS "postgis_topology";')
    await this.schema.raw('DROP EXTENSION IF EXISTS "postgis";')
  }
}
