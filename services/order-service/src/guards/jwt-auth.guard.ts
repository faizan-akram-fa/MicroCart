import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private httpService: HttpService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
      const response = await firstValueFrom(
        this.httpService.get(`${userServiceUrl}/auth/validate`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      request.user = response.data.user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
