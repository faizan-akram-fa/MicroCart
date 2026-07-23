import { IsEmail, IsString, MinLength, IsEnum, IsOptional, Matches } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[0-9])/, {
    message: 'Password must contain at least 1 Uppercase letter, 1 Number, and 1 Special character',
  })
  password: string;

  @IsString()
  @Matches(/\S/, { message: 'First name must not be empty or contain only spaces' })
  firstName: string;

  @IsString()
  @Matches(/\S/, { message: 'Last name must not be empty or contain only spaces' })
  lastName: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @Matches(/^\+92\d{10}$/, { message: 'Phone number must start with +92 followed by 10 digits' })
  phone?: string;

  @IsOptional()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsString()
  facebookId?: string;

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  storeAddress?: string;

  @IsOptional()
  @IsString()
  storeType?: string;

  @IsOptional()
  @IsString()
  cnicNumber?: string;

  @IsOptional()
  cnicImage?: any; // Handled via file upload
}

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  preferredCurrency?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  storeAddress?: string;

  @IsOptional()
  @IsString()
  storeType?: string;

  @IsOptional()
  @IsString()
  cnicNumber?: string;
}

export class GoogleAuthDto {
  @IsString()
  token: string;
}
export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[0-9])/, {
    message: 'Password must contain at least 1 Uppercase letter, 1 Number, and 1 Special character',
  })
  newPassword: string;
}
