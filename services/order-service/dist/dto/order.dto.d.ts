export interface OrderItemDto {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    image?: string;
    sellerId: string;
    shipping?: number;
}
export declare class CreateOrderDto {
    items: OrderItemDto[];
    totalAmount: number;
    shippingAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    promoCode?: string;
    paymentMethod?: string;
    transactionReference?: string;
    walletPhone?: string;
    cnic?: string;
}
export declare class UpdateOrderStatusDto {
    status: string;
}
