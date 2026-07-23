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
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../entities/product.entity");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let ProductService = class ProductService {
    constructor(productRepository, httpService, configService) {
        this.productRepository = productRepository;
        this.httpService = httpService;
        this.configService = configService;
    }
    async create(createProductDto, sellerId) {
        const product = this.productRepository.create({
            ...createProductDto,
            sellerId,
        });
        const savedProduct = await this.productRepository.save(product);
        return savedProduct;
    }
    async createBulk(productsDto, sellerId) {
        const products = productsDto.map(dto => this.productRepository.create({
            ...dto,
            sellerId,
            price: Number(dto.price),
            stock: Number(dto.stock),
            salePrice: dto.salePrice ? Number(dto.salePrice) : undefined,
        }));
        return this.productRepository.save(products);
    }
    async findAll(searchDto) {
        const { search, category, minPrice, maxPrice, minRating, sortBy = 'createdAt', sortOrder = 'DESC', page = 1, limit = 20, } = searchDto;
        const query = this.productRepository.createQueryBuilder('product');
        query.where('product.isActive = :isActive', { isActive: true });
        if (search) {
            query.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', { search: `%${search}%` });
        }
        if (category) {
            query.andWhere('product.category = :category', { category });
        }
        if (minPrice !== undefined && maxPrice !== undefined) {
            query.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
                minPrice,
                maxPrice,
            });
        }
        else if (minPrice !== undefined) {
            query.andWhere('product.price >= :minPrice', { minPrice });
        }
        else if (maxPrice !== undefined) {
            query.andWhere('product.price <= :maxPrice', { maxPrice });
        }
        if (minRating !== undefined) {
            query.andWhere('product.rating >= :minRating', { minRating });
        }
        query.orderBy(`product.${sortBy}`, sortOrder);
        query.skip((page - 1) * limit);
        query.take(limit);
        const [products, total] = await query.getManyAndCount();
        return {
            products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const product = await this.productRepository.findOne({
            where: { id, isActive: true },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return product;
    }
    async findBySeller(sellerId) {
        return this.productRepository.find({
            where: { sellerId, isActive: true },
            order: { createdAt: 'DESC' },
        });
    }
    async update(id, updateProductDto, sellerId) {
        const product = await this.productRepository.findOne({
            where: { id },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('You can only update your own products');
        }
        Object.assign(product, updateProductDto);
        return this.productRepository.save(product);
    }
    async remove(id, sellerId) {
        const product = await this.productRepository.findOne({
            where: { id },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (product.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('You can only delete your own products');
        }
        product.isActive = false;
        await this.productRepository.save(product);
        return { message: 'Product deleted successfully' };
    }
    async updateStock(productId, quantity) {
        const product = await this.productRepository.findOne({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (quantity > 0 && product.stock < quantity) {
            throw new common_1.BadRequestException(`Insufficient stock for product: ${product.name}`);
        }
        const oldStock = product.stock;
        product.stock -= quantity;
        const newStock = product.stock;
        const savedProduct = await this.productRepository.save(product);
        if ((oldStock > 5 && newStock <= 5 && newStock > 0) || (oldStock > 0 && newStock === 0)) {
            this.triggerInventoryAlert(savedProduct, newStock === 0 ? 'out-of-stock-alert' : 'low-stock-alert').catch(err => {
                console.error('Failed to trigger inventory alert', err);
            });
        }
        return savedProduct;
    }
    async setStock(productId, stock) {
        const product = await this.productRepository.findOne({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        const oldStock = product.stock;
        product.stock = Math.max(0, Number(stock));
        const newStock = product.stock;
        const savedProduct = await this.productRepository.save(product);
        if ((oldStock > 5 && newStock <= 5 && newStock > 0) || (oldStock > 0 && newStock === 0)) {
            this.triggerInventoryAlert(savedProduct, newStock === 0 ? 'out-of-stock-alert' : 'low-stock-alert').catch(err => {
                console.error('Failed to trigger inventory alert', err);
            });
        }
        return savedProduct;
    }
    async triggerInventoryAlert(product, alertType) {
        const userServiceUrl = this.configService.get('USER_SERVICE_URL', 'http://localhost:3001');
        const internalSecret = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
        try {
            const userRes = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${userServiceUrl}/users/${product.sellerId}`, {
                headers: { 'x-internal-secret': internalSecret }
            }));
            const seller = userRes.data;
            if (!seller.email)
                return;
            const payload = {
                email: seller.email,
                name: `${seller.firstName} ${seller.lastName}`,
                productData: {
                    productName: product.name,
                    stock: product.stock,
                }
            };
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${userServiceUrl}/internal/email/${alertType}`, payload, {
                headers: { 'x-internal-secret': internalSecret }
            }));
        }
        catch (error) {
            console.error(`Failed to send ${alertType} for product ${product.id}:`, error.message);
        }
    }
    async getAdminInventory() {
        return this.productRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService,
        config_1.ConfigService])
], ProductService);
//# sourceMappingURL=product.service.js.map