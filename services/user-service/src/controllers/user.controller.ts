import { Controller, Get, Put, Delete, Body, UseGuards, Req, Param, Post, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, Headers } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UpdateProfileDto, ChangePasswordDto } from '../dto/user.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private configService: ConfigService
  ) { }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return this.userService.getProfile(req.user.userId);
  }

  @Post('profile/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async uploadProfileImage(@Req() req, @UploadedFile() file) {
    if (!file) {
      throw new BadRequestException('File is not an image');
    }
    const frontendUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
      ? process.env.FRONTEND_URL.replace(/\/+$/, '')
      : 'https://microcart.me';
    const imageUrl = `${frontendUrl}/api/uploads/${file.filename}`;
    return this.userService.updateProfileImage(req.user.userId, imageUrl);
  }

  @Post('profile/cnic')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor({
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        const ext = extname(file.originalname) || '.jpg';
        return cb(null, `cnic_${randomName}${ext}`);
      },
    }),
  }))
  async uploadCnicImage(@Req() req) {
    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    console.log('[UserController] uploadCnicImage hit. Found file:', file ? file.filename : 'NULL', 'req.files length:', req.files?.length);
    if (!file) {
      throw new BadRequestException('CNIC Document upload failed. Please upload a valid JPG, PNG, or PDF file.');
    }
    const frontendUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
      ? process.env.FRONTEND_URL.replace(/\/+$/, '')
      : 'https://microcart.me';
    const imageUrl = `${frontendUrl}/api/uploads/${file.filename}`;
    return this.userService.updateCnicImage(req.user.userId, imageUrl);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Put('profile/resubmit-seller')
  @UseGuards(JwtAuthGuard)
  async resubmitSeller(@Req() req) {
    return this.userService.resubmitSeller(req.user.userId);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.userId, changePasswordDto);
  }

  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req) {
    return this.userService.deleteAccount(req.user.userId);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string, @Headers('x-internal-secret') internalSecret: string) {
    const secret = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
    if (internalSecret === secret) {
      return this.userService.getUserById(id);
    }
    
    // For now, allow regular access as well if it was previously public
    return this.userService.getUserById(id);
  }
}
