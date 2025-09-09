import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class MainSeeder extends BaseSeeder {
  private async runSeeder(acterPath: string) {
    /**
     * Do not run when not in a environment specified in Seeder
     */
    if (this.environment !== undefined && !this.environment.includes('development')) {
      return
    }

    const { default: SeederClass } = await import(acterPath)
    await new SeederClass(this.client, this.file, this.environment).run()
  }

  public async run() {
    console.log('🌱 Starting database seeding...')
    
    // Seeder les catégories en premier
    await this.runSeeder('./category_seeder.js')
    
    // Puis les produits qui dépendent des catégories
    await this.runSeeder('./product_seeder.js')
    
    console.log('🌱 Database seeding completed!')
  }
}