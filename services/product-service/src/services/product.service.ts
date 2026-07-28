import { Injectable, NotFoundException, ForbiddenException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto, SearchProductDto } from '../dto/product.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class ProductService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) { }

  async onModuleInit() {
    try {
      const count = await this.productRepository.count();
      if (count === 0) {
        console.log('Seeding initial products into database...');
        const initialProducts = [
          {
            name: 'Wireless Noise-Canceling Headphones',
            description: 'Premium over-ear wireless headphones with active noise cancellation and 30-hour battery life.',
            price: 199.99,
            category: 'Electronics',
            stock: 50,
            sellerId: 'system-admin',
            images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
            isActive: true,
          },
          {
            name: 'Ultra-Smart Fitness Watch',
            description: 'Waterproof smartwatch with heart rate monitoring, GPS tracking, and HD OLED display.',
            price: 129.50,
            category: 'Electronics',
            stock: 35,
            sellerId: 'system-admin',
            images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
            isActive: true,
          },
          {
            name: 'Pro Mechanical Gaming Keyboard',
            description: 'RGB backlit mechanical keyboard with customizable tactile switches and aluminum body.',
            price: 89.99,
            category: 'Electronics',
            stock: 40,
            sellerId: 'system-admin',
            images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80'],
            isActive: true,
          },
          {
            name: 'Ergonomic Office Chair',
            description: 'Breathable mesh executive desk chair with adjustable lumbar support and 3D armrests.',
            price: 249.00,
            category: 'Home & Garden',
            stock: 15,
            sellerId: 'system-admin',
            images: ['https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=600&q=80'],
            isActive: true,
          },
          {
            name: 'Classic Cotton Denim Jacket',
            description: 'Timeless vintage style denim jacket made from 100% organic durable cotton.',
            price: 69.95,
            category: 'Clothing',
            stock: 60,
            sellerId: 'system-admin',
            images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80'],
            isActive: true,
          },
          {
            name: 'Stainless Steel Insulated Water Bottle',
            description: 'Vacuum insulated 1-liter water bottle that keeps drinks cold for 24 hours or hot for 12 hours.',
            price: 24.99,
            category: 'Sports',
            stock: 100,
            sellerId: 'system-admin',
            images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80'],
            isActive: true,
          },
        ];
        await this.productRepository.save(initialProducts);
        console.log('Successfully seeded initial products!');
      }
    } catch (err) {
      console.error('Product seeding failed:', err.message);
    }
  }

  async create(createProductDto: CreateProductDto, sellerId: string) {
    const product = this.productRepository.create({
      ...createProductDto,
      sellerId,
    });

    const savedProduct = await this.productRepository.save(product);
    return savedProduct;
  }

  async createBulk(productsDto: CreateProductDto[], sellerId: string) {
    const products = productsDto.map(dto => this.productRepository.create({
      ...dto,
      sellerId,
      price: Number(dto.price),
      stock: Number(dto.stock),
      salePrice: dto.salePrice ? Number(dto.salePrice) : undefined,
    }));
    return this.productRepository.save(products);
  }

  async findAll(searchDto: SearchProductDto) {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = searchDto;

    const query = this.productRepository.createQueryBuilder('product');

    query.where('product.isActive = :isActive', { isActive: true });

    if (search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      query.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
        minPrice,
        maxPrice,
      });
    } else if (minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice });
    } else if (maxPrice !== undefined) {
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

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySeller(sellerId: string) {
    return this.productRepository.find({
      where: { sellerId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto, sellerId: string) {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You can only update your own products');
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string, sellerId: string) {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await this.productRepository.save(product);

    return { message: 'Product deleted successfully' };
  }

  async updateStock(productId: string, quantity: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity > 0 && product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
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

  async setStock(productId: string, stock: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
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

  private async triggerInventoryAlert(product: Product, alertType: 'low-stock-alert' | 'out-of-stock-alert') {
    const userServiceUrl = this.configService.get('USER_SERVICE_URL', 'http://localhost:3001');
    const internalSecret = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');

    try {
      const userRes = await firstValueFrom(
        this.httpService.get(`${userServiceUrl}/users/${product.sellerId}`, {
          headers: { 'x-internal-secret': internalSecret }
        })
      );

      const seller = userRes.data;
      if (!seller.email) return;

      const payload = {
        email: seller.email,
        name: `${seller.firstName} ${seller.lastName}`,
        productData: {
          productName: product.name,
          stock: product.stock,
        }
      };

      await firstValueFrom(
        this.httpService.post(`${userServiceUrl}/internal/email/${alertType}`, payload, {
          headers: { 'x-internal-secret': internalSecret }
        })
      );
    } catch (error: any) {
      console.error(`Failed to send ${alertType} for product ${product.id}:`, error.message);
    }
  }

  async getAdminInventory() {
    return this.productRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }
}
