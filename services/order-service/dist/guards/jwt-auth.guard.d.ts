import { CanActivate, ExecutionContext } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
export declare class JwtAuthGuard implements CanActivate {
    private httpService;
    constructor(httpService: HttpService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
