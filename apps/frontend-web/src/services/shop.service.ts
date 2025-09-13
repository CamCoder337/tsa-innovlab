// ============================================================================
// SHOP SERVICE
// ============================================================================

import { BaseApi } from './api';
import type {
    ProductListParams,
    CreateProductRequest,
    UpdateProductRequest
} from '../types/product.types';
import type {
    CategoryListParams,
    CreateCategoryRequest,
    UpdateCategoryRequest
} from '../types/category.types';
import type { ApiResponse } from '../types/api.types';

export class ShopService extends BaseApi {
    // ====================================
    // Product Operations
    // ====================================

    /**
     * Get a list of products with optional filters
     */
    async getProducts(params?: ProductListParams): Promise<ApiResponse> {
        const response = await this.axiosInstance.get('/api/shop/products', { params });
        return response.data;
    }

    /**
     * Get a single product by ID
     */
    async getProduct(id: string): Promise<ApiResponse> {
        const response = await this.axiosInstance.get(`/api/shop/products/${id}`);
        return response.data;
    }

    /**
     * Create a new product
     */
    async createProduct(data: CreateProductRequest): Promise<ApiResponse> {
        const response = await this.axiosInstance.post('/api/shop/products', data);
        return response.data;
    }

    /**
     * Update an existing product
     */
    async updateProduct(id: string, data: UpdateProductRequest): Promise<ApiResponse> {
        const response = await this.axiosInstance.put(`/api/shop/products/${id}`, data);
        return response.data;
    }

    /**
     * Delete a product
     */
    async deleteProduct(id: string): Promise<ApiResponse> {
        const response = await this.axiosInstance.delete(`/api/shop/products/${id}`);
        return response.data;
    }

    // ====================================
    // Category Operations
    // ====================================

    /**
     * Get a list of categories with optional filters
     */
    async getCategories(params?: CategoryListParams): Promise<ApiResponse> {
        const response = await this.axiosInstance.get('/api/shop/categories', { params });
        return response.data;
    }

    /**
     * Get a single category by ID
     */
    async getCategory(id: string): Promise<ApiResponse> {
        const response = await this.axiosInstance.get(`/api/shop/categories/${id}`);
        return response.data;
    }

    /**
     * Update an existing category
     */
    async updateCategory(id: string, data: UpdateCategoryRequest): Promise<ApiResponse> {
        const response = await this.axiosInstance.put(`/api/shop/categories/${id}`, data);
        return response.data;
    }

    /**
     * Create a new category
     */
    async createCategory(data: CreateCategoryRequest): Promise<ApiResponse> {
        const response = await this.axiosInstance.post('/api/shop/categories', data);
        return response.data;
    }

    /**
     * Delete a category
     */
    async deleteCategory(id: string): Promise<ApiResponse> {
        const response = await this.axiosInstance.delete(`/api/shop/categories/${id}`);
        return response.data;
    }

    // ====================================
    // Search Operations
    // ====================================

    /**
     * Search products with a query and optional filters
     */
    async searchProducts(
        query: string,
        params?: {
            page?: number;
            limit?: number;
            categoryId?: string;
            minPrice?: number;
            maxPrice?: number;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        }
    ): Promise<ApiResponse> {
        const response = await this.axiosInstance.get('/api/shop/search', {
            params: { q: query, ...params },
        });
        return response.data;
    }
}

export const shopService = new ShopService();
