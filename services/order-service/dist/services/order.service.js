"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../entities/order.entity");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const config_1 = require("@nestjs/config");
const promotion_service_1 = require("./promotion.service");
const transaction_entity_1 = require("../entities/transaction.entity");
const crypto = require("crypto");
const Stripe = require("stripe");
let OrderService = class OrderService {
    constructor(orderRepository, transactionRepository, httpService, configService, promotionService) {
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.httpService = httpService;
        this.configService = configService;
        this.promotionService = promotionService;
    }
    async create(createOrderDto, userId) {
        if (!createOrderDto.items || createOrderDto.items.length === 0) {
            throw new common_1.BadRequestException('Order must have at least one item');
        }
        let discountAmount = 0;
        if (createOrderDto.promoCode) {
            const validationResult = await this.promotionService.validate({
                code: createOrderDto.promoCode,
                cartItems: createOrderDto.items,
            });
            discountAmount = validationResult.discountAmount;
            await this.promotionService.incrementUsage(createOrderDto.promoCode);
        }
        const totalSubtotal = createOrderDto.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
        const itemsBySeller = createOrderDto.items.reduce((acc, item) => {
            const sId = item.sellerId || 'unknown';
            if (!acc[sId])
                acc[sId] = [];
            acc[sId].push(item);
            return acc;
        }, {});
        const savedOrders = [];
        const productServiceUrl = this.configService.get('PRODUCT_SERVICE_URL', 'http://localhost:3002');
        let stripeSessionUrl = null;
        for (const sellerId in itemsBySeller) {
            const items = itemsBySeller[sellerId];
            const sellerSubtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
            const isFreeShipCoupon = createOrderDto.promoCode && (createOrderDto.promoCode.toUpperCase().includes('FREE') || createOrderDto.promoCode.toUpperCase().includes('SHIP'));
            const sellerShipping = isFreeShipCoupon ? 0 : items.reduce((sum, item) => sum + (Number(item.shipping || 0) * Number(item.quantity)), 0);
            const sellerDiscount = totalSubtotal > 0 ? (sellerSubtotal / totalSubtotal) * discountAmount : 0;
            const finalTotal = sellerSubtotal - sellerDiscount + sellerShipping;
            const paymentMethod = createOrderDto.paymentMethod || 'cash_on_delivery';
            const isOnlinePayment = ['card', 'easypaisa', 'jazzcash'].includes(paymentMethod);
            const orderStatus = order_entity_1.OrderStatus.CONFIRMED;
            const txnReference = createOrderDto.transactionReference || null;
            const order = this.orderRepository.create({
                ...createOrderDto,
                items,
                userId,
                sellerId: sellerId === 'unknown' ? null : sellerId,
                discountAmount: sellerDiscount,
                totalAmount: finalTotal > 0 ? finalTotal : 0,
                status: orderStatus,
                transactionReference: txnReference,
            });
            if (paymentMethod !== 'card') {
                for (const item of items) {
                    try {
                        console.log(`[${paymentMethod.toUpperCase()}] Updating stock for product ${item.productId}, quantity: ${item.quantity}`);
                        await (0, rxjs_1.firstValueFrom)(this.httpService.put(`${productServiceUrl}/products/${item.productId}/stock`, {
                            quantity: item.quantity,
                        }));
                    }
                    catch (error) {
                        console.error(`Stock update failed for product ${item.productId}:`, error.response?.data || error.message);
                        throw new common_1.BadRequestException(error.response?.data?.message || `Failed to update stock for product ${item.productName}. It might be out of stock.`);
                    }
                }
            }
            const savedOrder = await this.orderRepository.save(order);
            const transaction = this.transactionRepository.create({
                orderId: savedOrder.id,
                userId: savedOrder.userId,
                paymentMethod: paymentMethod,
                amount: savedOrder.totalAmount,
                status: isOnlinePayment ? 'completed' : 'pending',
                transactionReference: txnReference,
            });
            await this.transactionRepository.save(transaction);
            if (paymentMethod !== 'card') {
                this.sendOrderEmail(savedOrder, 'order-confirmation');
            }
            savedOrders.push(savedOrder);
        }
        const firstOrder = savedOrders[0];
        if (firstOrder && firstOrder.paymentMethod === 'card') {
            const combinedOrderIds = savedOrders.map(o => o.id).join(',');
            const combinedTotal = savedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
            const combinedItems = savedOrders.flatMap(o => o.items);
            try {
                const stripeSession = await this.processStripePayment(combinedOrderIds, combinedTotal, combinedItems, userId);
                stripeSessionUrl = stripeSession.url;
                for (const savedOrder of savedOrders) {
                    savedOrder.transactionReference = stripeSession.id;
                    await this.orderRepository.save(savedOrder);
                    const transaction = this.transactionRepository.create({
                        orderId: savedOrder.id,
                        userId: savedOrder.userId,
                        paymentMethod: 'card',
                        amount: savedOrder.totalAmount,
                        status: 'pending',
                        transactionReference: stripeSession.id,
                    });
                    await this.transactionRepository.save(transaction);
                }
            }
            catch (err) {
                console.error('Failed to initiate Stripe checkout:', err.message);
                throw new common_1.BadRequestException(`Stripe checkout integration error: ${err.message}`);
            }
        }
        return {
            orders: savedOrders,
            paymentUrl: stripeSessionUrl,
            requiresRedirect: !!stripeSessionUrl,
        };
    }
    async sendOrderEmail(order, type) {
        const userServiceUrl = this.configService.get('USER_SERVICE_URL', 'http://localhost:3001');
        const internalSecret = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
        try {
            const userRes = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${userServiceUrl}/users/${order.userId}`, {
                headers: { 'x-internal-secret': internalSecret }
            }));
            const user = userRes.data;
            if (!user.email)
                return;
            const payload = type === 'order-confirmation'
                ? {
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    orderData: {
                        orderId: order.id.substring(0, 8),
                        items: order.items,
                        totalAmount: order.totalAmount,
                        address: order.shippingAddress
                    }
                }
                : {
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    orderId: order.id.substring(0, 8),
                    status: order.status
                };
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${userServiceUrl}/internal/email/${type}`, payload, {
                headers: { 'x-internal-secret': internalSecret }
            }));
        }
        catch (error) {
            console.error(`Failed to trigger ${type} email:`, error.message);
        }
    }
    async findByUser(userId) {
        return this.orderRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async findBySeller(sellerId) {
        return this.orderRepository
            .createQueryBuilder('order')
            .where('order.sellerId = :sellerId', { sellerId })
            .orderBy('order.createdAt', 'DESC')
            .getMany();
    }
    async getSellerBuyers(sellerId) {
        const orders = await this.orderRepository.find({
            where: { sellerId },
            select: ['userId'],
        });
        return [...new Set(orders.map(o => o.userId))];
    }
    async findOne(id) {
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async updateStatus(id, updateStatusDto, sellerId) {
        const order = await this.findOne(id);
        if (order.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('You are not authorized to update this order');
        }
        order.status = updateStatusDto.status;
        const updatedOrder = await this.orderRepository.save(order);
        if (['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(updatedOrder.status)) {
            this.sendOrderEmail(updatedOrder, 'order-status-update');
        }
        return updatedOrder;
    }
    async confirmWalletPayment(orderId, userId, transactionReference) {
        const order = await this.findOne(orderId);
        if (order.userId !== userId) {
            throw new common_1.ForbiddenException('You are not authorized to confirm this order');
        }
        if (order.status === order_entity_1.OrderStatus.CONFIRMED) {
            return order;
        }
        if (!['easypaisa', 'jazzcash'].includes(order.paymentMethod)) {
            throw new common_1.BadRequestException('confirmWalletPayment only applies to easypaisa/jazzcash orders');
        }
        const productServiceUrl = this.configService.get('PRODUCT_SERVICE_URL', 'http://localhost:3002');
        for (const item of order.items) {
            try {
                console.log(`[WalletConfirm] Deducting stock for product ${item.productId}, qty: ${item.quantity}`);
                await (0, rxjs_1.firstValueFrom)(this.httpService.put(`${productServiceUrl}/products/${item.productId}/stock`, {
                    quantity: item.quantity,
                }));
            }
            catch (error) {
                console.error(`Stock update failed for ${item.productId}:`, error.response?.data || error.message);
            }
        }
        order.status = order_entity_1.OrderStatus.CONFIRMED;
        if (transactionReference) {
            order.transactionReference = transactionReference;
        }
        const confirmedOrder = await this.orderRepository.save(order);
        try {
            const txn = await this.transactionRepository.findOne({ where: { orderId } });
            if (txn) {
                txn.status = 'completed';
                txn.transactionReference = transactionReference || txn.transactionReference;
                await this.transactionRepository.save(txn);
            }
        }
        catch (e) {
            console.error('Failed to update transaction record:', e.message);
        }
        this.sendOrderEmail(confirmedOrder, 'order-confirmation');
        return confirmedOrder;
    }
    async findAll() {
        return this.orderRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async getAdminStats(period) {
        let dateFilter = {};
        if (period && period !== 'all') {
            const now = new Date();
            if (period === 'daily' || period === 'day') {
                now.setDate(now.getDate() - 1);
                dateFilter = { createdAt: (0, typeorm_2.MoreThanOrEqual)(now) };
            }
            else if (period === 'weekly' || period === 'week') {
                now.setDate(now.getDate() - 7);
                dateFilter = { createdAt: (0, typeorm_2.MoreThanOrEqual)(now) };
            }
            else if (period === 'monthly' || period === 'month') {
                now.setMonth(now.getMonth() - 1);
                dateFilter = { createdAt: (0, typeorm_2.MoreThanOrEqual)(now) };
            }
        }
        const orders = await this.orderRepository.find({ where: dateFilter });
        const isOrderRevenue = (o) => {
            const isOnline = ['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod);
            if (isOnline) {
                return ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status);
            }
            return o.status === 'delivered';
        };
        const totalRevenue = orders
            .filter(isOrderRevenue)
            .reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const completedOrders = orders.filter(o => o.status === 'delivered' ||
            (['card', 'easypaisa', 'jazzcash'].includes(o.paymentMethod) &&
                ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status))).length;
        return {
            totalRevenue,
            totalOrders,
            pendingOrders,
            completedOrders,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        };
    }
    async verifyPurchase(userId, productId) {
        const orders = await this.orderRepository
            .createQueryBuilder('order')
            .where('order.userId = :userId', { userId })
            .andWhere('order.status = :status', { status: 'delivered' })
            .andWhere(`order.items @> :item`, { item: JSON.stringify([{ productId }]) })
            .getMany();
        return orders.length > 0;
    }
    async getAllTransactions() {
        return this.transactionRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async processEasyPaisaPayment(orderId, amount, walletPhone, emailAddress) {
        const storeId = this.configService.get('EASYPAISA_STORE_ID');
        const username = this.configService.get('EASYPAISA_USERNAME');
        const password = this.configService.get('EASYPAISA_PASSWORD');
        const apiUrl = this.configService.get('EASYPAISA_API_URL', 'https://easypay-sandbox.easypaisa.com.pk/easypay/api/v1/merchant-payments');
        if (!storeId || !username || !password) {
            console.warn('EasyPaisa credentials missing in .env. Running in Demo Mock Mode.');
            const simulatedRef = `TRX-EP-${Math.floor(100000 + Math.random() * 900000)}`;
            return simulatedRef;
        }
        try {
            const payload = {
                orderId: orderId,
                storeId: storeId,
                transactionAmount: amount.toFixed(2),
                transactionType: 'MA',
                msisdn: walletPhone,
                emailAddress: emailAddress || 'buyer@example.com',
            };
            const credentialsBase64 = Buffer.from(`${username}:${password}`).toString('base64');
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Credentials': credentialsBase64,
                },
            }));
            const resData = response.data;
            if (resData && (resData.responseCode === '0000' || resData.responseCode === '00')) {
                return resData.transactionId || `TRX-EP-${Math.floor(100000 + Math.random() * 900000)}`;
            }
            else {
                throw new common_1.BadRequestException(resData?.responseDesc || 'EasyPaisa payment request was declined by the gateway.');
            }
        }
        catch (error) {
            console.error('EasyPaisa Payment API Error:', error.response?.data || error.message);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(error.response?.data?.responseDesc || error.response?.data?.message || 'EasyPaisa payment gateway connection failure.');
        }
    }
    async processJazzCashPayment(orderId, amount, walletPhone, cnic) {
        const merchantId = this.configService.get('JAZZCASH_MERCHANT_ID');
        const password = this.configService.get('JAZZCASH_PASSWORD');
        const integritySalt = this.configService.get('JAZZCASH_INTEGRITY_SALT');
        const apiUrl = this.configService.get('JAZZCASH_API_URL', 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTxnRequest');
        if (!merchantId || !password || !integritySalt) {
            console.warn('JazzCash credentials missing in .env. Running in Demo Mock Mode.');
            const simulatedRef = `TRX-JC-${Math.floor(100000 + Math.random() * 900000)}`;
            return simulatedRef;
        }
        try {
            const formatDateTime = (date) => {
                const pad = (n) => String(n).padStart(2, '0');
                return (date.getFullYear() +
                    pad(date.getMonth() + 1) +
                    pad(date.getDate()) +
                    pad(date.getHours()) +
                    pad(date.getMinutes()) +
                    pad(date.getSeconds()));
            };
            const now = new Date();
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + 1);
            const txnRefNo = `TXN${formatDateTime(now)}${Math.floor(100 + Math.random() * 900)}`;
            const amountInPaisa = Math.round(amount * 100).toString();
            const payload = {
                pp_Version: '1.1',
                pp_TxnType: 'MWALLET',
                pp_Language: 'EN',
                pp_MerchantID: merchantId,
                pp_SubMerchantID: '',
                pp_Password: password,
                pp_TxnRefNo: txnRefNo,
                pp_Amount: amountInPaisa,
                pp_TxnCurrency: 'PKR',
                pp_TxnDateTime: formatDateTime(now),
                pp_BillReference: `BILL-${orderId.substring(0, 8).toUpperCase()}`,
                pp_Description: `MicroCart Purchase - Order ${orderId.substring(0, 8)}`,
                pp_TxnExpiryDateTime: formatDateTime(expiry),
                pp_MobileNumber: walletPhone,
                pp_CNIC: cnic,
            };
            const sortedKeys = Object.keys(payload)
                .filter(key => payload[key] !== '' && key !== 'pp_SecureHash')
                .sort();
            const dataString = sortedKeys
                .map(key => `${key}=${payload[key]}`)
                .join('&');
            const fullHashString = integritySalt + '&' + dataString;
            const secureHash = crypto
                .createHmac('sha256', integritySalt)
                .update(fullHashString)
                .digest('hex')
                .toUpperCase();
            payload['pp_SecureHash'] = secureHash;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            }));
            const resData = response.data;
            if (resData && (resData.pp_ResponseCode === '000' || resData.pp_ResponseCode === '00')) {
                return resData.pp_TxnRefNo || txnRefNo;
            }
            else {
                throw new common_1.BadRequestException(resData?.pp_ResponseMessage || 'JazzCash payment request was declined by the gateway.');
            }
        }
        catch (error) {
            console.error('JazzCash Payment API Error:', error.response?.data || error.message);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(error.response?.data?.pp_ResponseMessage || error.response?.data?.message || 'JazzCash payment gateway connection failure.');
        }
    }
    async processStripePayment(orderId, amount, items, userId) {
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        const exchangeRate = this.configService.get('STRIPE_CURRENCY_CONVERSION_RATE', 278);
        if (!stripeSecretKey) {
            console.warn('STRIPE_SECRET_KEY is missing in .env. Running in Mock Mode.');
            return {
                id: `cs_mock_${Math.floor(100000 + Math.random() * 900000)}`,
                url: `${frontendUrl}/checkout/stripe-mock?order_id=${orderId}&amount=${amount}`,
            };
        }
        try {
            const stripe = new Stripe(stripeSecretKey, {
                apiVersion: '2023-10-16',
            });
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: items.map(item => {
                    const priceInUsd = Number(item.price) / exchangeRate;
                    return {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: item.productName || 'E-Commerce Product',
                            },
                            unit_amount: Math.round(priceInUsd * 100),
                        },
                        quantity: Number(item.quantity),
                    };
                }),
                mode: 'payment',
                success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
                cancel_url: `${frontendUrl}/checkout/cancel?order_id=${orderId}`,
                metadata: {
                    orderId: orderId,
                    userId: userId,
                },
            });
            return {
                id: session.id,
                url: session.url,
            };
        }
        catch (error) {
            console.error('Stripe Session Error:', error.message);
            throw new common_1.BadRequestException(`Stripe gateway integration error: ${error.message}`);
        }
    }
    async handleStripeWebhook(rawBody, signature) {
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        const stripeWebhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!stripeSecretKey) {
            throw new common_1.BadRequestException('Stripe secret key is not configured.');
        }
        if (!stripeWebhookSecret || stripeWebhookSecret === 'whsec_dummy_local_testing') {
            console.warn('Stripe webhook signature check bypassed in mock mode');
            try {
                const body = JSON.parse(rawBody.toString());
                if (body.type === 'checkout.session.completed') {
                    const session = body.data.object;
                    const orderIdStr = session.metadata?.orderId || session.metadata?.orderIds;
                    if (orderIdStr) {
                        const orderIds = orderIdStr.split(',');
                        for (const id of orderIds) {
                            await this.confirmOrderPayment(id, session.id || 'mock_session_id');
                        }
                    }
                }
                return { received: true, mock: true };
            }
            catch (err) {
                throw new common_1.BadRequestException(`Failed to process mock Stripe webhook: ${err.message}`);
            }
        }
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
        }
        catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            throw new common_1.BadRequestException(`Webhook signature verification failed: ${err.message}`);
        }
        console.log(`Received verified Stripe event: ${event.type}`);
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const orderIdStr = session.metadata?.orderId || session.metadata?.orderIds;
            const paymentStatus = session.payment_status;
            console.log(`Processing completed session for Order ID string: ${orderIdStr}, Payment Status: ${paymentStatus}`);
            if (orderIdStr && paymentStatus === 'paid') {
                const orderIds = orderIdStr.split(',');
                for (const id of orderIds) {
                    await this.confirmOrderPayment(id, session.id);
                }
            }
        }
        return { received: true };
    }
    async confirmOrderPayment(orderId, stripeSessionId) {
        const order = await this.orderRepository.findOne({ where: { id: orderId } });
        if (!order) {
            console.error(`Order with ID ${orderId} not found during webhook processing`);
            return;
        }
        if (order.status !== order_entity_1.OrderStatus.CONFIRMED) {
            order.status = order_entity_1.OrderStatus.CONFIRMED;
            order.transactionReference = stripeSessionId;
            await this.orderRepository.save(order);
            console.log(`Order ${orderId} status updated to CONFIRMED`);
            const txn = await this.transactionRepository.findOne({ where: { orderId: orderId } });
            if (txn) {
                txn.status = 'completed';
                txn.transactionReference = stripeSessionId;
                await this.transactionRepository.save(txn);
                console.log(`Transaction for Order ${orderId} updated to completed`);
            }
        }
    }
    async cancelPayment(orderId, userId) {
        const orderIds = orderId.split(',');
        let firstOrder = null;
        for (const id of orderIds) {
            const order = await this.orderRepository.findOne({ where: { id: id } });
            if (!order) {
                continue;
            }
            if (order.userId !== userId) {
                throw new common_1.ForbiddenException('You are not authorized to cancel this order');
            }
            if (order.status !== order_entity_1.OrderStatus.PENDING) {
                continue;
            }
            if (order.paymentMethod !== 'card') {
                throw new common_1.BadRequestException('Only card payment orders can be cancelled');
            }
            order.status = order_entity_1.OrderStatus.CANCELLED;
            const savedOrder = await this.orderRepository.save(order);
            if (!firstOrder) {
                firstOrder = savedOrder;
            }
            const productServiceUrl = this.configService.get('PRODUCT_SERVICE_URL', 'http://localhost:3002');
            for (const item of order.items) {
                try {
                    console.log(`Restoring stock for product ${item.productId}, quantity: ${item.quantity}`);
                    await (0, rxjs_1.firstValueFrom)(this.httpService.put(`${productServiceUrl}/products/${item.productId}/stock`, {
                        quantity: -item.quantity,
                    }));
                }
                catch (error) {
                    console.error(`Stock restoration failed for product ${item.productId}:`, error.message);
                }
            }
            const txn = await this.transactionRepository.findOne({ where: { orderId: id } });
            if (txn) {
                txn.status = 'failed';
                await this.transactionRepository.save(txn);
                console.log(`Transaction for Order ${id} updated to failed`);
            }
        }
        if (!firstOrder) {
            throw new common_1.NotFoundException('No pending orders found to cancel');
        }
        return firstOrder;
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService,
        config_1.ConfigService,
        promotion_service_1.PromotionService])
], OrderService);
//# sourceMappingURL=order.service.js.map