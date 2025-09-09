import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Category from '#models/category'

export default class CategorySeeder extends BaseSeeder {
  async run() {
    // Categories principales
    const categories = [
      {
        name: 'Électronique',
        description: 'Produits électroniques et informatiques',
        imageUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Mobilier',
        description: 'Meubles et équipements de bureau',
        imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Fournitures de Bureau',
        description: 'Papeterie et accessoires de bureau',
        imageUrl: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400',
        isActive: true,
        displayOrder: 3,
      },
      {
        name: 'Équipements Industriels',
        description: 'Machines et équipements pour l\'industrie',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        isActive: true,
        displayOrder: 4,
      },
      {
        name: 'Véhicules et Transport',
        description: 'Véhicules de transport et logistique',
        imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        isActive: true,
        displayOrder: 5,
      },
    ]

    // Créer les catégories
    for (const categoryData of categories) {
      const existingCategory = await Category.findBy('name', categoryData.name)
      if (!existingCategory) {
        await Category.create(categoryData)
      }
    }

    console.log('✅ Categories seeded successfully')
  }
}