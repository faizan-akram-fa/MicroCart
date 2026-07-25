import { Controller, Post, Body, Get, UseGuards, Req, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto, ResetPasswordDto, ForgotPasswordDto } from '../dto/user.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('cnicImage', {
    storage: diskStorage({
      destination: './uploads/cnic',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Unsupported file type'), false);
      }
    },
  }))
  async register(@Body() registerDto: RegisterDto, @UploadedFile() file: Express.Multer.File) {
    if (registerDto.role === 'seller' && !file) {
      throw new BadRequestException('CNIC Image/PDF is required for sellers');
    }
    if (file) {
      registerDto.cnicImage = file.path;
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
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}&role=${result.user.role}`);
    } catch (error) {
      console.error('❌ Google Auth Redirect Error:', error.message);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
