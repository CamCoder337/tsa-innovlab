import { create } from 'zustand';
import type { Category, CategoryFilterParams, CategoryStoreExtended } from '@/types/category.types';

const mockCategories: Category[] = [
  {
    id: '4c90652d-ae2e-4bc6-93e1-1a30369c02b7',
    name: 'Électronique',
    description: 'Produits électroniques et informatiques',
    parentId: null,
    slug: 'electronique',
    imageUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400',
    isActive: true,
    displayOrder: 1,
    createdAt: '2025-09-11T00:42:40.671+01:00',
    updatedAt: '2025-09-11T00:42:40.671+01:00',
    products: [
      {
        id: '7ae4dacf-7533-4914-959b-bffbafd44908',
        name: 'Ordinateur Portable Dell XPS 15',
        categoryId: '4c90652d-ae2e-4bc6-93e1-1a30369c02b7',
      },
      {
        id: 'dcc3908f-4986-40e6-a3d4-94539f14b258',
        name: 'iPhone 14 Pro',
        categoryId: '4c90652d-ae2e-4bc6-93e1-1a30369c02b7',
      },
      {
        id: '117a566f-4a0c-465f-85a2-21ab8f83af57',
        name: 'Écran Samsung 27" 4K',
        categoryId: '4c90652d-ae2e-4bc6-93e1-1a30369c02b7',
      },
      {
        id: '5da92b2b-cc27-4892-b936-67a30c9bdf0a',
        name: 'Imprimante Laser HP LaserJet Pro',
        categoryId: '4c90652d-ae2e-4bc6-93e1-1a30369c02b7',
      },
      {
        id: 'f010eed4-5627-4fa6-b21d-e42922a6166c',
        name: 'Clavier Mécanique Logitech MX',
        categoryId: '4c90652d-ae2e-4bc6-93e1-1a30369c02b7',
      },
    ],
  },
  {
    id: '345dbf1c-37a5-431b-9a64-b1165e68da72',
    name: 'Mobilier',
    description: 'Meubles et équipements de bureau',
    parentId: null,
    slug: 'mobilier',
    imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
    isActive: true,
    displayOrder: 2,
    createdAt: '2025-09-11T00:42:40.676+01:00',
    updatedAt: '2025-09-11T00:42:40.676+01:00',
    products: [],
  },
  {
    id: '4b5304fd-91fc-420b-87af-6ca59b4c02df',
    name: 'Fournitures de Bureau',
    description: 'Papeterie et accessoires de bureau',
    parentId: null,
    slug: 'fournitures-de-bureau',
    imageUrl: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400',
    isActive: true,
    displayOrder: 3,
    createdAt: '2025-09-11T00:42:40.681+01:00',
    updatedAt: '2025-09-21T10:32:42.387+01:00',
    products: [],
  },
  {
    id: '1d978f99-bbb5-4d90-a745-4afc97948c04',
    name: 'Équipements Industriels',
    description: "Machines et équipements pour l'industrie",
    parentId: null,
    slug: 'equipements-industriels',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
    isActive: true,
    displayOrder: 4,
    createdAt: '2025-09-11T00:42:40.684+01:00',
    updatedAt: '2025-09-11T00:42:40.684+01:00',
    products: [],
  },
  {
    id: 'e289151a-a26f-4b49-840f-2ff6c6b0a3b2',
    name: 'Véhicules et Transport',
    description: 'Véhicules de transport et logistique',
    parentId: null,
    slug: 'vehicules-et-transport',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
    isActive: true,
    displayOrder: 5,
    createdAt: '2025-09-11T00:42:40.768+01:00',
    updatedAt: '2025-09-11T00:42:40.768+01:00',
    products: [],
  },
];

function persistCategoriesToLocalStorage(categories: Category[]) {
  try {
    localStorage.setItem('tsa_categories', JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to persist categories to localStorage:', error);
  }
}

function loadCategoriesFromLocalStorage(): Category[] {
  try {
    const raw = localStorage.getItem('tsa_categories');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Failed to load categories from localStorage:', error);
  }
  return mockCategories;
}

export const useCategoryStore = create<CategoryStoreExtended>((set, get) => ({
  // State
  categories: loadCategoriesFromLocalStorage(),
  currentCategory: null,
  isLoading: false,
  error: null,

  // Basic actions
  setCategories: (categories: Category[]) => {
    persistCategoriesToLocalStorage(categories);
    set({ categories });
  },

  addCategory: (category: Category) => {
    const categories = get().categories;
    const newCategory = {
      ...category,
      createdAt: category.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedCategories = [...categories, newCategory];
    persistCategoriesToLocalStorage(updatedCategories);
    set({ categories: updatedCategories });
  },

  updateCategory: (id: string, updates: Partial<Category>) => {
    const categories = get().categories;
    const updatedCategories = categories.map((category) =>
      category.id === id
        ? { ...category, ...updates, updatedAt: new Date().toISOString() }
        : category
    );
    persistCategoriesToLocalStorage(updatedCategories);
    set({ categories: updatedCategories });
  },

  deleteCategory: (id: string) => {
    const categories = get().categories;
    const categoriesToDelete = [id];
    const findChildren = (parentId: string) => {
      categories.forEach((cat) => {
        if (cat.parentId === parentId) {
          categoriesToDelete.push(cat.id);
          findChildren(cat.id);
        }
      });
    };
    findChildren(id);

    const updatedCategories = categories.filter(
      (category) => !categoriesToDelete.includes(category.id)
    );
    persistCategoriesToLocalStorage(updatedCategories);
    set({ categories: updatedCategories });
  },

  setCurrentCategory: (category: Category | null) => {
    set({ currentCategory: category });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Utility methods
  //   buildCategoryTree: (categories: Category[]) => {
  //     const categoryMap = new Map<string, CategoryTreeNode>();
  //     const rootCategories: CategoryTreeNode[] = [];

  //     // First pass: create all nodes
  //     categories.forEach((category) => {
  //       const node: CategoryTreeNode = {
  //         ...category,
  //         children: [],
  //         level: 0,
  //         productCount: 0,
  //       };
  //       categoryMap.set(category.id, node);
  //     });

  //     // Second pass: build tree structure and calculate levels
  //     categories.forEach((category) => {
  //       const node = categoryMap.get(category.id)!;

  //       if (category.parentId) {
  //         const parent = categoryMap.get(category.parentId);
  //         if (parent) {
  //           parent.children.push(node);
  //           node.level = parent.level + 1;
  //         }
  //       } else {
  //         rootCategories.push(node);
  //       }
  //     });

  //     // Sort by displayOrder
  //     const sortByDisplayOrder = (nodes: CategoryTreeNode[]) => {
  //       nodes.sort((a, b) => a.displayOrder - b.displayOrder);
  //       nodes.forEach((node) => sortByDisplayOrder(node.children));
  //     };

  //     sortByDisplayOrder(rootCategories);
  //     return rootCategories;
  //   },

  filterCategories: (filters: CategoryFilterParams) => {
    const categories = get().categories;
    return categories.filter((category) => {
      if (filters.parentId !== undefined && category.parentId !== filters.parentId) return false;
      if (filters.isActive !== undefined && category.isActive !== filters.isActive) return false;
      return true;
    });
  },

  searchCategories: (query: string) => {
    const categories = get().categories;
    const lowercaseQuery = query.toLowerCase();
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(lowercaseQuery) ||
        category.description?.toLowerCase().includes(lowercaseQuery) ||
        category.slug.toLowerCase().includes(lowercaseQuery)
    );
  },

  getCategoryPath: (categoryId: string) => {
    const categories = get().categories;
    const path: Category[] = [];

    let currentId: string | null = categoryId;
    while (currentId) {
      const category = categories.find((cat) => cat.id === currentId);
      if (category) {
        path.unshift(category);
        currentId = category.parentId;
      } else {
        break;
      }
    }

    return path;
  },
}));
