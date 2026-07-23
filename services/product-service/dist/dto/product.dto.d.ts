export declare class CreateProductDto {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    images?: string[];
    brand?: string;
    storeName?: string;
    salePrice?: number;
    isOnSale?: boolean;
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    salePrice?: number;
    isOnSale?: boolean;
    category?: string;
    stock?: number;
    images?: string[];
    brand?: string;
    isActive?: boolean;
}
export declare class SearchProductDto {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
}
