import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductService } from '../services/product.service';
import { CreateProductDto, UpdateProductDto, SearchProductDto } from '../dto/product.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const isImage =
        !file.mimetype ||
        file.mimetype === 'application/octet-stream' ||
        file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|bmp|svg\+xml)$/i) ||
        file.originalname.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);

      if (isImage) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only image files are allowed!'), false);
      }
    },
  }))
  async create(
    @Body() body: any,
    @UploadedFiles() files: Array<any>,
    @Req() req
  ) {
    console.log('Create Product Body:', body);
    console.log('User:', req.user);
    if (files && files.length > 0) {
      const frontendUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
        ? process.env.FRONTEND_URL.replace(/\/+$/, '')
        : 'https://microcart.me';
      const imageUrls = files.map(file => `${frontendUrl}/api/uploads/${file.filename}`);
      body.images = imageUrls;
    }

    // Convert stringified numbers back to numbers if coming from FormData
    const productDto = {
      ...body,
      price: Number(body.price),
      stock: Number(body.stock),
      salePrice: body.salePrice ? Number(body.salePrice) : undefined,
      isOnSale: body.isOnSale === 'true' || body.isOnSale === true,
      // If images somehow came in body as well, prefer uploaded files
      images: body.images || [],
    };

    return this.productService.create(productDto, req.user.userId);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  async createBulk(
    @Body() products: any[],
    @Req() req
  ) {
    if (!Array.isArray(products)) {
      throw new BadRequestException('Payload must be an array of products');
    }
    return this.productService.createBulk(products, req.user.userId);
  }

  @Get()
  async findAll(@Query() searchDto: SearchProductDto) {
    return this.productService.findAll(searchDto);
  }

  @Get('seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  async findBySeller(@Req() req) {
    return this.productService.findBySeller(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Array<any>,
    @Req() req,
  ) {
    if (files && files.length > 0) {
      const serverUrl = process.env.API_URL || 'http://localhost:3002';
      const newImageUrls = files.map(file => `${serverUrl}/uploads/${file.filename}`);

      // Combine with existing images if any (assuming they might be sent as comma-separated string or array in body)
      let existingImages = [];
      if (body.existingImages) {
        existingImages = Array.isArray(body.existingImages) ? body.existingImages : [body.existingImages];
      }
      body.images = [...existingImages, ...newImageUrls];
    }

    const productDto = {
      ...body,
      price: body.price ? Number(body.price) : undefined,
      stock: body.stock ? Number(body.stock) : undefined,
      salePrice: body.salePrice ? Number(body.salePrice) : undefined,
      isOnSale: body.isOnSale !== undefined ? (body.isOnSale === 'true' || body.isOnSale === true) : undefined,
    };

    return this.productService.update(id, productDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  async remove(@Param('id') id: string, @Req() req) {
    return this.productService.remove(id, req.user.userId);
  }
  @Put(':id/stock')
  async updateStock(@Param('id') id: string, @Body('quantity') quantity: number, @Body('isSet') isSet?: boolean) {
    if (isSet) {
      return this.productService.setStock(id, quantity);
    }
    return this.productService.updateStock(id, quantity);
  }

  @Get('admin/inventory')
  @UseGuards(JwtAuthGuard)
  async getAdminInventory(@Req() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      throw new BadRequestException('Forbidden: Admin access only');
    }
    return this.productService.getAdminInventory();
  }

  @Post('bulk/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @UseInterceptors(FilesInterceptor('images', 50, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadBulkImages(@UploadedFiles() files: Array<any>) {
    const serverUrl = process.env.API_URL || 'http://localhost:3002';
    return files.map(file => ({
      originalName: file.originalname,
      url: `${serverUrl}/uploads/${file.filename}`
    }));
  }
}
