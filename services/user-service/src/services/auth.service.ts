import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, SellerStatus } from '../entities/user.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { RegisterDto, LoginDto, ResetPasswordDto, ForgotPasswordDto } from '../dto/user.dto';
import { EmailService } from '../modules/email/email.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ActivityLog)
    private logRepository: Repository<ActivityLog>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) { }

  private async logActivity(userId: string, userEmail: string, action: string, targetId: string, details: string) {
    try {
      const log = this.logRepository.create({
        userId,
        userEmail,
        action,
        targetId,
        details,
      });
      await this.logRepository.save(log);
    } catch (e) {
      console.error('Failed to save activity log:', e);
    }
  }

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = 'admin@microcart.com';
    const existingAdmin = await this.userRepository.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      console.log('Seeding primary admin user...');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      const admin = this.userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Primary',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
        profileImage: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
      });
      await this.userRepository.save(admin);
      console.log('✅ Primary admin seeded successfully.');
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (registerDto.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: registerDto.phone },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    if (registerDto.cnicNumber) {
      const existingCnic = await this.userRepository.findOne({
        where: { cnicNumber: registerDto.cnicNumber },
      });
      if (existingCnic) {
        throw new ConflictException('CNIC already registered with another user');
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Security: Only allow buyer or seller during public registration, otherwise default to PENDING
    const roleValue = registerDto.role || UserRole.PENDING;

    const user = this.userRepository.create({
      ...registerDto,
      role: roleValue,
      password: hashedPassword,
      profileImage: `https://ui-avatars.com/api/?name=${registerDto.firstName}+${registerDto.lastName}&background=random&color=fff`,
      ...(roleValue === UserRole.SELLER && { sellerStatus: SellerStatus.PENDING }),
    });

    await this.userRepository.save(user);

    await this.logActivity(user.id, user.email, 'USER_REGISTER', user.id, `New ${user.role} account registered: ${user.email}`);

    // 1. Send General Welcome Email
    this.emailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);

    // 2. Send Role-Specific Welcome Email
    if (user.role === UserRole.BUYER) {
      this.emailService.sendBuyerWelcomeEmail(user.email, user.firstName);
    } else if (user.role === UserRole.SELLER) {
      this.emailService.sendSellerWelcomeEmail(user.email, user.firstName);
    }

    const payload = { sub: user.id, email: user.email, role: user.role, permissions: user.permissions || [] };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        storeName: user.storeName,
        storeAddress: user.storeAddress,
        storeType: user.storeType,
        cnicNumber: user.cnicNumber,
        sellerStatus: user.sellerStatus,
        rejectionReason: user.rejectionReason,
        permissions: user.permissions || [],
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async login(loginDto: LoginDto) {
    let user;

    if (loginDto.phone) {
      user = await this.userRepository.findOne({ where: { phone: loginDto.phone } });
    } else {
      user = await this.userRepository.findOne({ where: { email: loginDto.email } });
    }

    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account deleted or blocked. Contact support');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, permissions: user.permissions || [] };
    const token = this.jwtService.sign(payload);

    await this.logActivity(user.id, user.email, 'USER_LOGIN', user.id, `User ${user.email} (${user.role}) logged in successfully`);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImage: user.profileImage,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        storeName: user.storeName,
        storeAddress: user.storeAddress,
        storeType: user.storeType,
        cnicNumber: user.cnicNumber,
        sellerStatus: user.sellerStatus,
        rejectionReason: user.rejectionReason,
        permissions: user.permissions || [],
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account deleted or blocked. Contact support');
    }

    return user;
  }

  async googleLogin(googleUser: any) {
    try {
      console.log('Google login attempt for:', googleUser.email);
      
      let user = await this.userRepository.findOne({
        where: { googleId: googleUser.id },
      });

      if (user) {
        console.log('User found by Google ID:', user.email);
        if (user.profileImage !== googleUser.picture) {
          user.profileImage = googleUser.picture;
          await this.userRepository.save(user);
        }
      }

      if (!user) {
        console.log('User not found by Google ID, searching by email...');
        user = await this.userRepository.findOne({
          where: { email: googleUser.email },
        });

        if (user) {
          console.log('User found by email, linking Google ID:', user.email);
          user.googleId = googleUser.id;
          await this.userRepository.save(user);
        } else {
          console.log('Creating new user from Google profile:', googleUser.email);
          const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          
          user = this.userRepository.create({
            email: googleUser.email,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            profileImage: googleUser.picture,
            googleId: googleUser.id,
            password: hashedPassword,
            role: UserRole.PENDING,
            isActive: true,
          } as Partial<User>);
          
          await this.userRepository.save(user);
          console.log('✅ New user created successfully');

          // Send Welcome Email for Google user
          this.emailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);
        }
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account deleted or blocked. Contact support');
      }

      const payload = { sub: user.id, email: user.email, role: user.role, permissions: user.permissions || [] };
      const token = this.jwtService.sign(payload);

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImage: user.profileImage,
          phone: user.phone,
          address: user.address,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          country: user.country,
          storeName: user.storeName,
          storeAddress: user.storeAddress,
          storeType: user.storeType,
          cnicNumber: user.cnicNumber,
          sellerStatus: user.sellerStatus,
          rejectionReason: user.rejectionReason,
          permissions: user.permissions || [],
          mustChangePassword: user.mustChangePassword,
        },
      };
    } catch (error) {
      console.error('❌ Error in googleLogin:', error);
      throw error;
    }
  }

  async forgotPassword(forgotDto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({ where: { email: forgotDto.email } });

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account deleted or blocked. Contact support');
    }

    // Generate a random 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    await this.userRepository.save(user);

    // Send the email
    await this.emailService.sendOtpEmail(user.email, `${user.firstName} ${user.lastName}`.trim(), otp);

    return { message: 'OTP verification code sent to email' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account deleted or blocked. Contact support');
    }

    if (!user.otp || user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      throw new BadRequestException('OTP has expired');
    }

    // Extend expiry on successful validation to allow password input completion
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await this.userRepository.save(user);

    return { valid: true };
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({ where: { email: resetDto.email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account deleted or blocked. Contact support');
    }

    if (!user.otp || user.otp !== resetDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      user.otp = null;
      user.otpExpiry = null;
      await this.userRepository.save(user);
      throw new BadRequestException('OTP has expired');
    }

    const isSamePassword = await bcrypt.compare(resetDto.newPassword, user.password);
    if (isSamePassword) {
      throw new ConflictException('Old password cannot be used as new');
    }

    user.password = await bcrypt.hash(resetDto.newPassword, 10);
    user.otp = null;
    user.otpExpiry = null;
    await this.userRepository.save(user);

    return { message: 'Password reset successfully' };
  }

  async setRole(userId: string, role: string) {
    // Security: Users can only switch between buyer and seller roles manually
    if (role !== UserRole.BUYER && role !== UserRole.SELLER) {
      throw new BadRequestException('Invalid role. Normal users can only choose Buyer or Seller.');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role as UserRole;
    if (user.role === UserRole.SELLER) {
      user.sellerStatus = SellerStatus.PENDING;
    }
    await this.userRepository.save(user);

    // Send role-specific welcome email after selection
    if (user.role === UserRole.BUYER) {
      this.emailService.sendBuyerWelcomeEmail(user.email, user.firstName);
    } else if (user.role === UserRole.SELLER) {
      this.emailService.sendSellerWelcomeEmail(user.email, user.firstName);
    }

    // Generate new token with updated role
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      permissions: user.permissions || []
    };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Role updated successfully',
      user: {
        ...user,
        cnicNumber: user.cnicNumber
      },
      access_token: token
    };
  }
}
