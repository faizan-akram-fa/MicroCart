import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ReviewService } from '../services/review.service';
import { CreateReviewDto, UpdateReviewStatusDto } from '../dto/review.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  // POST /reviews — authenticated users post a review
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 3, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async create(
    @Body() body: any,
    @UploadedFiles() files: Array<any>,
    @Req() req
  ) {
    const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Verified Customer';
    
    if (files && files.length > 0) {
      const serverUrl = process.env.API_URL || 'http://localhost:3002';
      const imageUrls = files.map(file => `${serverUrl}/uploads/${file.filename}`);
      body.images = imageUrls;
    }

    const createReviewDto = {
      ...body,
      rating: Number(body.rating),
    };

    return this.reviewService.create(createReviewDto, req.user.userId, userName);
  }

  // POST /reviews/guest — public, guests post a review (PENDING by default)
  @Post('guest')
  @UseInterceptors(FilesInterceptor('images', 3, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async createGuest(
    @Body() body: any,
    @UploadedFiles() files: Array<any>,
  ) {
    const userName = body.userName || 'Guest User';
    
    if (files && files.length > 0) {
      const serverUrl = process.env.API_URL || 'http://localhost:3002';
      const imageUrls = files.map(file => `${serverUrl}/uploads/${file.filename}`);
      body.images = imageUrls;
    }

    const createReviewDto = {
      ...body,
      rating: Number(body.rating),
    };

    return this.reviewService.create(createReviewDto, null, userName);
  }

  // GET /reviews/product/:productId — public, returns approved reviews
  @Get('product/:productId')
  async findAllForProduct(@Param('productId') productId: string) {
    return this.reviewService.findAllForProduct(productId);
  }

  // GET /reviews/admin/all — admin only, returns all reviews
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async findAllForAdmin(@Req() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      throw new ForbiddenException('Admin access only');
    }
    if (req.user.role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_REVIEWS')) {
      throw new ForbiddenException('You do not have permission to view reviews');
    }
    return this.reviewService.findAllForAdmin();
  }

  // GET /reviews/seller — seller only, returns reviews for their products
  @Get('seller')
  @UseGuards(JwtAuthGuard)
  async findAllForSeller(@Req() req) {
    if (req.user.role !== 'seller') {
      throw new ForbiddenException('Seller access only');
    }
    return this.reviewService.findAllForSeller(req.user.userId);
  }

  // PATCH /reviews/:id — author updates their review
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param('id') id: string,
    @Body() body: { comment: string, rating: number },
    @Req() req,
  ) {
    return this.reviewService.updateComment(id, body.comment, body.rating, req.user.userId);
  }

  // PUT /reviews/:id/status — admin or seller (for their products)
  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReviewStatusDto,
    @Req() req,
  ) {
    const role = req.user.role;
    if (role !== 'admin' && role !== 'sub_admin' && role !== 'seller') {
      throw new ForbiddenException('Unauthorized');
    }
    if (role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_REVIEWS')) {
      throw new ForbiddenException('You do not have permission to moderate reviews');
    }

    // If seller, check ownership in service or here. 
    // I'll update service to handle permission check for updateStatus too.
    return this.reviewService.updateStatus(id, dto, req.user.userId, role);
  }

  // DELETE /reviews/:id — admin or seller (for their products)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req) {
    const role = req.user.role;
    if (
      role !== 'admin' &&
      role !== 'sub_admin' &&
      role !== 'seller'
    ) {
      throw new ForbiddenException('Unauthorized');
    }
    if (role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_REVIEWS')) {
      throw new ForbiddenException('You do not have permission to delete reviews');
    }
    return this.reviewService.remove(id, req.user.userId, role);
  }
}
