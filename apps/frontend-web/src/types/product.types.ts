// ============================================================================
// PRODUCT TYPES
// ============================================================================

import type { User } from './user.types';
import type { Category } from './category.types';

export interface Product {
    id: string;
    name: string;
    description: string;
    reference: string;
    price: number;
    stock: number;
    stockAlert: number;
    unit: string;
    imageUrl: string;
    specifications?: {
        color?: string;
        weight?: string;
        wheels?: string;
        folding?: string;
        capacity?: string;
        material?: string;
        brand?: string;
        model?: string;
        condition?: string;
        warranty?: string;
        type?: string;
        series?: string;
    };
    images: string[];
    isActive: boolean;
    categoryId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    // Relations
    category?: Category;
    creator?: User;
}

export interface CreateProductRequest {
    name: string;
    description?: string;
    reference?: string;
    price: number;
    stock?: number;
    stockAlert?: number;
    unit?: string;
    imageUrl?: string;
    specifications?: {
        color?: string;
        weight?: string;
        wheels?: string;
        folding?: string;
        capacity?: string;
        material?: string;
        brand?: string;
        model?: string;
        condition?: string;
        warranty?: string;
        type?: string;
        series?: string;
    };
    images?: string[];
    isActive?: boolean;
    categoryId: string;
}

export interface UpdateProductRequest extends Partial<Omit<CreateProductRequest, 'id' | 'createdAt' | 'updatedAt'>> {
    id: string;
    stockAdjustment?: number;
    adjustmentReason?: string;
}

export interface ProductFilters {
    categoryId?: string;
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    lowStock?: boolean;
}

export interface ProductListParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: ProductFilters;
}

export interface BulkProductRequest {
    productIds: string[];
    action: 'activate' | 'deactivate' | 'delete';
}

export interface ProductStats {
    products: {
        total: number;
        active: number;
        inactive: number;
        lowStock: number;
        outOfStock: number;
    };
    inventory: {
        totalValue: number;
    };
    topCategories: Array<{
        name: string;
        productCount: number;
    }>;
}

export interface StockMovement {
    id: string;
    productId: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason: string | null;
    reference: string | null;
    userId: string | null;
    createdAt: string;
    // Relations
    product?: Product;
    user?: User;
}
