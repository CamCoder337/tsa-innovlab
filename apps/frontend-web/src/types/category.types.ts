// ============================================================================
// CATEGORY TYPES - TSA Monolith API Compatible
// ============================================================================

import type { Product } from "./product.types";

export interface Category {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    slug: string;
    imageUrl: string | null;
    isActive: boolean;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
    // Relations (using any to avoid circular imports)
    products?: Product[];
    children?: Category[];
    parent?: Category;
}

export interface CreateCategoryRequest {
    name: string;
    description?: string;
    parentId?: string | null;
    slug?: string;
    imageUrl?: string | null;
    isActive?: boolean;
    displayOrder?: number;
}

export interface UpdateCategoryRequest extends Partial<Omit<CreateCategoryRequest, 'id'>> {
    id: string;
}

export interface CategoryTreeNode extends Category {
    children: CategoryTreeNode[];
    level: number;
    productCount?: number;
}

export interface CategoryFilters {
    parentId?: string;
    isActive?: boolean;
}

export interface CategoryListParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: CategoryFilters;
}
