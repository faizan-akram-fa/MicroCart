import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto, SearchProductDto } from '../dto/product.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class ProductService {
    private productRepository;
    private httpService;
    private configService;
    constructor(productRepository: Repository<Product>, httpService: HttpService, configService: ConfigService);
    create(createProductDto: CreateProductDto, sellerId: string): Promise<Product>;
    createBulk(productsDto: CreateProductDto[], sellerId: string): Promise<Product[]>;
    findAll(searchDto: SearchProductDto): Promise<{
        products: Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<Product>;
    findBySeller(sellerId: string): Promise<Product[]>;
    update(id: string, updateProductDto: UpdateProductDto, sellerId: string): Promise<Product>;
    remove(id: string, sellerId: string): Promise<{
        message: string;
    }>;
    updateStock(productId: string, quantity: number): Promise<Product>;
    setStock(productId: string, stock: number): Promise<Product>;
    private triggerInventoryAlert;
    getAdminInventory(): Promise<Product[]>;
}
