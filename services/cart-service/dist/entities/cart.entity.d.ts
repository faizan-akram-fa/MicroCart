export interface CartItem {
    productId: string;
    quantity: number;
    price: number;
    name: string;
    description?: string;
    image?: string;
    sellerId: string;
    stock?: number;
}
export declare class Cart {
    id: string;
    userId: string;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
}
