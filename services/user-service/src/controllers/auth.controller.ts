import { Controller, Post, Body, Get, UseGuards, Req, Res, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto, ResetPasswordDto, ForgotPasswordDto } from '../dto/user.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @UseInterceptors(AnyFilesInterceptor({
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        const ext = extname(file.originalname) || '.jpg';
        cb(null, `cnic_${randomName}${ext}`);
      },
    }),
  }))
  async register(@Req() req, @Body() registerDto: RegisterDto, @UploadedFiles() files: Express.Multer.File[]) {
    const file = (files && files.length > 0 ? files[0] : null) || req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    console.log('[AuthController] Register request role:', registerDto.role, 'File received:', file ? file.filename : 'NO FILE');
    if (registerDto.role === 'seller' && !file && !registerDto.cnicImage) {
      throw new BadRequestException('CNIC Document (Image/PDF) is required for sellers');
    }
    if (file) {
      registerDto.cnicImage = file.path.replace(/\\/g, '/');
    }
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('test-error')
  async testError() {
    console.error('🚨 TEST ERROR: Grafana & Loki log verification test triggered successfully!');
    throw new BadRequestException('🚨 Test error triggered for Grafana log verification');
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    try {
      console.log('Google callback received, user in request:', req.user ? 'Yes' : 'No');
      if (!req.user) {
        throw new BadRequestException('Google authentication failed: No user profile received');
      }
      
      const result = await this.authService.googleLogin(req.user);
      console.log(`Redirecting to frontend with role: ${result.user.role}`);
      
      const frontendUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
        ? process.env.FRONTEND_URL.replace(/\/+$/, '')
        : 'https://microcart.me';
      return res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}&role=${result.user.role}`);
    } catch (error) {
      console.error('❌ Google Auth Redirect Error:', error.message);
      const frontendUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
        ? process.env.FRONTEND_URL.replace(/\/+$/, '')
        : 'https://microcart.me';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Req() req) {
    return {
      valid: true,
      user: req.user,
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('role')
  @UseGuards(JwtAuthGuard)
  async setRole(@Req() req, @Body('role') role: string) {
    return this.authService.setRole(req.user.userId, role);
  }
}
