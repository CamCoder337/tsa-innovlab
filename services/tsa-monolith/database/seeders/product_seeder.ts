import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product'
import Category from '#models/category'
import User from '#models/user'

export default class ProductSeeder extends BaseSeeder {
  async run() {
    // Récupérer les catégories existantes
    const categories = await Category.all()
    if (categories.length === 0) {
      console.log('❌ No categories found. Please run CategorySeeder first.')
      return
    }

    // Récupérer un utilisateur admin pour créer les produits
    const adminUser = await User.query().where('role', 'admin').first()
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.')
      return
    }

    const products = [
      // Électronique (6 produits)
      {
        name: 'Ordinateur Portable Dell XPS 15',
        description: 'Ordinateur portable professionnel 15.6" avec processeur Intel i7',
        reference: 'DELL-XPS15-001',
        price: 1899.99,
        stock: 25,
        stockAlert: 5,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        ]),
        specifications: JSON.stringify({
          processor: 'Intel Core i7-12700H',
          ram: '16GB DDR4',
          storage: '512GB SSD',
          screen: '15.6" Full HD',
          graphics: 'NVIDIA RTX 3050',
        }),
        categoryName: 'Électronique',
      },
      {
        name: 'iPhone 14 Pro',
        description: 'Smartphone Apple iPhone 14 Pro 256GB',
        reference: 'APPLE-IP14P-256',
        price: 1329.0,
        stock: 15,
        stockAlert: 3,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400',
        ]),
        specifications: JSON.stringify({
          storage: '256GB',
          camera: '48MP Triple Camera',
          display: '6.1" Super Retina XDR',
          chip: 'A16 Bionic',
        }),
        categoryName: 'Électronique',
      },
      {
        name: 'Écran Samsung 27" 4K',
        description: 'Moniteur professionnel 27 pouces Ultra HD 4K',
        reference: 'SAMSUNG-M27-4K',
        price: 349.99,
        stock: 40,
        stockAlert: 8,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
        ]),
        specifications: JSON.stringify({
          size: '27 inches',
          resolution: '3840x2160 4K UHD',
          refreshRate: '60Hz',
          connectivity: 'HDMI, USB-C, DisplayPort',
        }),
        categoryName: 'Électronique',
      },
      {
        name: 'Imprimante Laser HP LaserJet Pro',
        description: 'Imprimante laser noir et blanc professionnelle',
        reference: 'HP-LJ-PRO-001',
        price: 289.0,
        stock: 20,
        stockAlert: 4,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400',
        ]),
        specifications: JSON.stringify({
          type: 'Laser Monochrome',
          speed: '25 pages/min',
          connectivity: 'WiFi, Ethernet, USB',
          paperCapacity: '250 sheets',
        }),
        categoryName: 'Électronique',
      },
      {
        name: 'Clavier Mécanique Logitech MX',
        description: 'Clavier mécanique sans fil pour professionnels',
        reference: 'LOGI-MX-KEYS',
        price: 129.99,
        stock: 60,
        stockAlert: 10,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
        ]),
        specifications: JSON.stringify({
          type: 'Mechanical',
          connectivity: 'Wireless 2.4GHz + Bluetooth',
          battery: 'Up to 5 months',
          backlight: 'Smart illumination',
        }),
        categoryName: 'Électronique',
      },
      {
        name: 'Souris Gaming Razer DeathAdder',
        description: 'Souris gaming ergonomique haute précision',
        reference: 'RAZER-DA-V3',
        price: 79.99,
        stock: 45,
        stockAlert: 8,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
        ]),
        specifications: JSON.stringify({
          dpi: '30000 DPI',
          buttons: '8 programmable buttons',
          connectivity: 'USB Wired',
          lighting: 'RGB Chroma',
        }),
        categoryName: 'Électronique',
      },

      // Mobilier (6 produits)
      {
        name: 'Bureau Assis-Debout Électrique',
        description: 'Bureau réglable en hauteur électriquement 140x70cm',
        reference: 'DESK-ELEC-140',
        price: 599.0,
        stock: 12,
        stockAlert: 2,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        images: JSON.stringify(['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400']),
        specifications: JSON.stringify({
          dimensions: '140x70cm',
          height: '71-121cm adjustable',
          material: 'Steel frame, melamine top',
          weight: '45kg',
        }),
        categoryName: 'Mobilier',
      },
      {
        name: 'Chaise de Bureau Ergonomique Herman Miller',
        description: 'Fauteuil de bureau ergonomique premium avec support lombaire',
        reference: 'HM-AERON-001',
        price: 1299.0,
        stock: 8,
        stockAlert: 2,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        ]),
        specifications: JSON.stringify({
          material: 'Mesh back, fabric seat',
          adjustments: '12-point adjustment',
          armrests: 'Adjustable',
          warranty: '12 years',
        }),
        categoryName: 'Mobilier',
      },
      {
        name: 'Armoire de Rangement 2 Portes',
        description: 'Armoire de bureau métallique avec serrure',
        reference: 'ARM-MET-2P',
        price: 189.99,
        stock: 30,
        stockAlert: 5,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        ]),
        specifications: JSON.stringify({
          dimensions: '90x40x180cm',
          material: 'Steel with powder coating',
          shelves: '4 adjustable shelves',
          security: 'Key lock',
        }),
        categoryName: 'Mobilier',
      },
      {
        name: 'Table de Réunion Ovale 8 Places',
        description: 'Grande table de réunion en bois massif pour 8 personnes',
        reference: 'TABLE-OVAL-8',
        price: 899.0,
        stock: 5,
        stockAlert: 1,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=400',
        ]),
        specifications: JSON.stringify({
          dimensions: '240x120cm',
          material: 'Solid oak wood',
          capacity: '8 people',
          finish: 'Natural oil finish',
        }),
        categoryName: 'Mobilier',
      },
      {
        name: 'Étagère Modulaire 5 Niveaux',
        description: "Système d'étagères modulaire en métal",
        reference: 'ETAG-MOD-5N',
        price: 159.99,
        stock: 25,
        stockAlert: 5,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        ]),
        specifications: JSON.stringify({
          levels: '5 adjustable shelves',
          dimensions: '180x80x40cm',
          material: 'Steel frame',
          capacity: '50kg per shelf',
        }),
        categoryName: 'Mobilier',
      },
      {
        name: 'Caisson Mobile 3 Tiroirs',
        description: 'Caisson de bureau mobile avec 3 tiroirs et serrure',
        reference: 'CAISSON-3T',
        price: 129.0,
        stock: 35,
        stockAlert: 7,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        ]),
        specifications: JSON.stringify({
          drawers: '3 drawers',
          dimensions: '40x55x60cm',
          mobility: '4 wheels with brakes',
          security: 'Central lock',
        }),
        categoryName: 'Mobilier',
      },

      // Fournitures de Bureau (6 produits)
      {
        name: 'Lot de 500 Feuilles A4 Premium',
        description: 'Papier blanc A4 80g/m² haute qualité',
        reference: 'PAPIER-A4-500',
        price: 12.99,
        stock: 200,
        stockAlert: 50,
        unit: 'lot',
        imageUrl: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400',
        images: JSON.stringify(['https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400']),
        specifications: JSON.stringify({
          format: 'A4 (210x297mm)',
          weight: '80g/m²',
          whiteness: '96% ISO',
          quantity: '500 sheets',
        }),
        categoryName: 'Fournitures de Bureau',
      },
      {
        name: 'Lot de 12 Stylos Bille Bleus',
        description: 'Stylos à bille encre bleue pointe moyenne',
        reference: 'STYLO-BILLE-12',
        price: 8.5,
        stock: 150,
        stockAlert: 30,
        unit: 'lot',
        imageUrl: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400',
        images: JSON.stringify(['https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400']),
        specifications: JSON.stringify({
          type: 'Ballpoint pen',
          ink: 'Blue',
          tip: 'Medium point 1.0mm',
          quantity: '12 pens',
        }),
        categoryName: 'Fournitures de Bureau',
      },
      {
        name: 'Agrafeuse Métallique Heavy Duty',
        description: 'Agrafeuse robuste pour 50 feuilles',
        reference: 'AGRAF-HD-50',
        price: 24.99,
        stock: 80,
        stockAlert: 15,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400',
        images: JSON.stringify(['https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400']),
        specifications: JSON.stringify({
          capacity: '50 sheets',
          staples: '26/6 and 26/8',
          material: 'Metal construction',
          guarantee: '2 years',
        }),
        categoryName: 'Fournitures de Bureau',
      },
      {
        name: 'Classeurs à Levier A4 (Lot de 10)',
        description: 'Classeurs à levier dos 8cm couleurs assorties',
        reference: 'CLASS-LEV-10',
        price: 35.0,
        stock: 60,
        stockAlert: 12,
        unit: 'lot',
        imageUrl: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400',
        images: JSON.stringify(['https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400']),
        specifications: JSON.stringify({
          format: 'A4',
          spine: '8cm',
          material: 'Cardboard with PP coating',
          colors: 'Assorted colors',
        }),
        categoryName: 'Fournitures de Bureau',
      },
      {
        name: 'Calculatrice Scientifique Casio',
        description: 'Calculatrice scientifique programmable',
        reference: 'CALC-CASIO-FX',
        price: 45.99,
        stock: 40,
        stockAlert: 8,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400',
        images: JSON.stringify(['https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400']),
        specifications: JSON.stringify({
          functions: '417 scientific functions',
          display: '2-line display',
          memory: '9 variable memories',
          power: 'Solar + battery',
        }),
        categoryName: 'Fournitures de Bureau',
      },
      {
        name: 'Tableau Blanc Magnétique 120x90cm',
        description: 'Tableau blanc effaçable à sec avec marqueurs',
        reference: 'TABLEAU-120x90',
        price: 89.99,
        stock: 18,
        stockAlert: 3,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400',
        images: JSON.stringify(['https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400']),
        specifications: JSON.stringify({
          dimensions: '120x90cm',
          surface: 'Magnetic lacquered steel',
          frame: 'Aluminum',
          accessories: 'Markers and eraser included',
        }),
        categoryName: 'Fournitures de Bureau',
      },

      // Équipements Industriels (6 produits)
      {
        name: 'Perceuse à Colonne Industrielle',
        description: 'Perceuse à colonne 16mm pour usage intensif',
        reference: 'PERC-COL-16',
        price: 899.0,
        stock: 10,
        stockAlert: 2,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        ]),
        specifications: JSON.stringify({
          capacity: '16mm in steel',
          motor: '750W',
          speeds: '12 speeds',
          table: '410x410mm',
        }),
        categoryName: 'Équipements Industriels',
      },
      {
        name: "Compresseur d'Air 100L",
        description: "Compresseur d'air 3HP réservoir 100 litres",
        reference: 'COMP-AIR-100L',
        price: 649.99,
        stock: 8,
        stockAlert: 2,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        ]),
        specifications: JSON.stringify({
          tank: '100 liters',
          power: '3HP',
          pressure: '8 bar',
          output: '350L/min',
        }),
        categoryName: 'Équipements Industriels',
      },
      {
        name: 'Poste à Souder MIG/MAG',
        description: 'Station de soudage semi-automatique professionnelle',
        reference: 'SOUD-MIG-PRO',
        price: 1299.0,
        stock: 6,
        stockAlert: 1,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        ]),
        specifications: JSON.stringify({
          type: 'MIG/MAG',
          current: '20-200A',
          wire: '0.6-1.2mm',
          duty: '60% at 200A',
        }),
        categoryName: 'Équipements Industriels',
      },
      {
        name: 'Scie Circulaire sur Table',
        description: 'Scie circulaire stationnaire 254mm',
        reference: 'SCIE-CIRC-254',
        price: 459.0,
        stock: 12,
        stockAlert: 2,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        ]),
        specifications: JSON.stringify({
          blade: '254mm',
          motor: '1800W',
          table: '640x487mm',
          depth: '79mm at 90°',
        }),
        categoryName: 'Équipements Industriels',
      },
      {
        name: "Meuleuse d'Angle 125mm",
        description: "Meuleuse d'angle professionnelle 1400W",
        reference: 'MEUL-ANG-125',
        price: 89.99,
        stock: 35,
        stockAlert: 8,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        ]),
        specifications: JSON.stringify({
          disc: '125mm',
          power: '1400W',
          speed: '11000 rpm',
          safety: 'Restart protection',
        }),
        categoryName: 'Équipements Industriels',
      },
      {
        name: "Établi d'Atelier Professionnel",
        description: 'Établi robuste avec étau et rangements',
        reference: 'ETAB-PRO-001',
        price: 349.0,
        stock: 15,
        stockAlert: 3,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        ]),
        specifications: JSON.stringify({
          dimensions: '150x60x85cm',
          material: 'Steel frame, hardwood top',
          vise: 'Integrated 150mm vise',
          storage: '2 drawers + tool rack',
        }),
        categoryName: 'Équipements Industriels',
      },

      // Véhicules et Transport (6 produits)
      {
        name: 'Camion de Livraison Iveco Daily',
        description: 'Véhicule utilitaire pour livraisons urbaines',
        reference: 'IVECO-DAILY-001',
        price: 45000.0,
        stock: 3,
        stockAlert: 1,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        ]),
        specifications: JSON.stringify({
          capacity: '3.5 tons',
          volume: '12.8 m³',
          engine: '2.3L Diesel',
          transmission: 'Manual 6-speed',
        }),
        categoryName: 'Véhicules et Transport',
      },
      {
        name: 'Chariot Élévateur Toyota 2T',
        description: 'Chariot élévateur électrique 2 tonnes',
        reference: 'TOYOTA-FE-2T',
        price: 28500.0,
        stock: 2,
        stockAlert: 1,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        ]),
        specifications: JSON.stringify({
          capacity: '2000kg',
          lift: '3000mm',
          type: 'Electric',
          battery: '48V 500Ah',
        }),
        categoryName: 'Véhicules et Transport',
      },
      {
        name: 'Transpalette Électrique',
        description: 'Transpalette électrique 1.5T avec batteries lithium',
        reference: 'TRANSP-ELEC-15',
        price: 3250.0,
        stock: 8,
        stockAlert: 2,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        ]),
        specifications: JSON.stringify({
          capacity: '1500kg',
          forks: '1150mm',
          battery: 'Lithium-ion',
          speed: '6.5 km/h',
        }),
        categoryName: 'Véhicules et Transport',
      },
      {
        name: 'Remorque Plateau 750kg',
        description: 'Remorque plateau non freinée pour utilitaires',
        reference: 'REM-PLAT-750',
        price: 899.0,
        stock: 12,
        stockAlert: 3,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        ]),
        specifications: JSON.stringify({
          payload: '750kg',
          dimensions: '2.5x1.3m',
          type: 'Non-braked',
          material: 'Galvanized steel',
        }),
        categoryName: 'Véhicules et Transport',
      },
      {
        name: 'Gerbeur Électrique 1.6m',
        description: 'Gerbeur électrique pour stockage en hauteur',
        reference: 'GERB-ELEC-16',
        price: 2890.0,
        stock: 6,
        stockAlert: 1,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        ]),
        specifications: JSON.stringify({
          capacity: '1000kg',
          lift: '1600mm',
          mast: 'Duplex',
          battery: '12V 100Ah',
        }),
        categoryName: 'Véhicules et Transport',
      },
      {
        name: 'Diable de Transport Aluminium',
        description: 'Diable pliable en aluminium charge 200kg',
        reference: 'DIABLE-ALU-200',
        price: 159.0,
        stock: 25,
        stockAlert: 5,
        unit: 'unité',
        imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        ]),
        specifications: JSON.stringify({
          capacity: '200kg',
          material: 'Aluminum',
          wheels: 'Pneumatic',
          folding: 'Yes',
        }),
        categoryName: 'Véhicules et Transport',
      },
    ]

    // Créer les produits
    for (const productData of products) {
      const { categoryName, ...product } = productData

      // Trouver la catégorie
      const category = categories.find((cat) => cat.name === categoryName)
      if (!category) {
        console.log(`❌ Category ${categoryName} not found for product ${product.name}`)
        continue
      }

      // Vérifier si le produit existe déjà
      const existingProduct = await Product.findBy('reference', product.reference)
      if (!existingProduct) {
        await Product.create({
          ...product,
          categoryId: category.id,
          createdBy: adminUser.id,
        })
      }
    }

    console.log('✅ Products seeded successfully')
  }
}
