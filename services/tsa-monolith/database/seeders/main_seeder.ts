import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class MainSeeder extends BaseSeeder {
  private async runSeeder(acterPath: string) {
    /**
     * Do not run when not in a environment specified in Seeder
     */
    if (MainSeeder.environment !== undefined && !MainSeeder.environment.includes('development')) {
      return
    }

    const { default: SeederClass } = await import(acterPath)
    await new SeederClass(this.client, undefined, MainSeeder.environment).run()
  }

  public async run() {
    console.log('🌱 Starting database seeding...')

    // 1. Créer l'utilisateur admin en premier
    await this.runSeeder('./admin_user_seeder.js')

    // 2. Créer les utilisateurs par défaut (affreteur + transporteur + client)
    await this.runSeeder('./default_users_seeder.js')

    // 3. Seeder les catégories
    await this.runSeeder('./category_seeder.js')

    // 4. Puis les produits qui dépendent des catégories et de l'admin
    await this.runSeeder('./product_seeder.js')

    console.log('🌱 Database seeding completed!')
  }
}
