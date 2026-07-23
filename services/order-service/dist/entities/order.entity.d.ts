export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    image?: string;
    sellerId: string;
    shipping?: number;
}
export declare class Order {
    id: string;
    userId: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    shippingAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    paymentMethod: string;
    transactionReference: string;
    sellerId: string;
    promoCode: string;
    discountAmount: number;
    createdAt: Date;
    updatedAt: Date;
}
