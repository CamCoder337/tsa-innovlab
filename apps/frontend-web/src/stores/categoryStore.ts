import { create } from 'zustand';
import type { Category, CategoryFilters, CategoryTreeNode } from '@/types/category.types';

export interface CategoryState {
    categories: Category[];
    currentCategory: Category | null;
    isLoading: boolean;
    error: string | null;
}

export interface CategoryActions {
    setCategories: (categories: Category[]) => void;
    addCategory: (category: Category) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;
    setCurrentCategory: (category: Category | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export interface CategoryStoreExtended extends CategoryState, CategoryActions {
    // Utility methods
    filterCategories: (filters: CategoryFilters) => Category[];
    searchCategories: (query: string) => Category[];
    getCategoryPath: (categoryId: string) => Category[];
}

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
    return [];
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
        // Also delete all child categories
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
    buildCategoryTree: (categories: Category[]) => {
        const categoryMap = new Map<string, CategoryTreeNode>();
        const rootCategories: CategoryTreeNode[] = [];

        // First pass: create all nodes
        categories.forEach((category) => {
            const node: CategoryTreeNode = {
                ...category,
                children: [],
                level: 0,
                productCount: 0,
            };
            categoryMap.set(category.id, node);
        });

        // Second pass: build tree structure and calculate levels
        categories.forEach((category) => {
            const node = categoryMap.get(category.id)!;

            if (category.parentId) {
                const parent = categoryMap.get(category.parentId);
                if (parent) {
                    parent.children.push(node);
                    node.level = parent.level + 1;
                }
            } else {
                rootCategories.push(node);
            }
        });

        // Sort by displayOrder
        const sortByDisplayOrder = (nodes: CategoryTreeNode[]) => {
            nodes.sort((a, b) => a.displayOrder - b.displayOrder);
            nodes.forEach((node) => sortByDisplayOrder(node.children));
        };

        sortByDisplayOrder(rootCategories);
        return rootCategories;
    },

    filterCategories: (filters: CategoryFilters) => {
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
