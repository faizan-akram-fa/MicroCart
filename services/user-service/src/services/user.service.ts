import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProfileDto.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: updateProfileDto.phone },
      });

      if (existingPhone && existingPhone.id !== userId) {
        throw new ConflictException('Phone number already in use');
      }
    }

    if (updateProfileDto.cnicNumber) {
      const existingCnic = await this.userRepository.findOne({
        where: { cnicNumber: updateProfileDto.cnicNumber },
      });

      if (existingCnic && existingCnic.id !== userId) {
        throw new ConflictException('CNIC already registered with another user');
      }
    }

    Object.assign(user, updateProfileDto);
    await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  async changePassword(userId: string, changePasswordDto: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Invalid old password');
    }

    const isSamePassword = await bcrypt.compare(changePasswordDto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password cannot be the same as the old password');
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.mustChangePassword = false;
    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  async updateProfileImage(userId: string, imageUrl: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.profileImage = imageUrl;
    await this.userRepository.save(user);
    return {
      message: 'Profile image updated successfully',
      imageUrl
    };
  }

  async updateCnicImage(userId: string, imageUrl: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.cnicImage = imageUrl;
    await this.userRepository.save(user);
    return {
      message: 'CNIC image updated successfully',
      imageUrl
    };
  }

  async resubmitSeller(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    if (user.role !== 'seller') {
      throw new BadRequestException('User is not a seller');
    }

    user.sellerStatus = 'pending' as any; // SellerStatus.PENDING
    user.rejectionReason = null;
    await this.userRepository.save(user);
    
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'Seller application resubmitted successfully',
      user: userWithoutPassword
    };
  }

  async deleteAccount(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.isActive = false;
    await this.userRepository.save(user);

    return { message: 'Account deleted successfully' };
  }
}
