import { Controller, Get, Post, Put, Delete, Body, UseGuards, Req, Param, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async getAllUsers(@Req() req) {
    return this.adminService.getAllUsers();
  }

  @Get('sellers/pending')
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async getPendingSellers(@Req() req) {
    return this.adminService.getPendingSellers();
  }

  @Put('sellers/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async approveSeller(@Param('id') id: string, @Req() req) {
    console.log(`[AdminController] Attempting to approve seller ID: ${id}`);
    console.log(`[AdminController] Admin requesting approval: ID=${req?.user?.userId}, Email=${req?.user?.email}`);
    
    if (req.user.role === UserRole.SUB_ADMIN && !req.user.permissions?.includes('MANAGE_SELLERS')) {
      throw new ForbiddenException('You do not have permission to modify sellers');
    }
    try {
      return await this.adminService.approveSeller(id, req.user.userId, req.user.email);
    } catch(e) {
      console.error(`[AdminController] Error inside approveSeller:`, e);
      throw new BadRequestException(e.message || 'Unknown error');
    }
  }

  @Put('sellers/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async rejectSeller(@Param('id') id: string, @Body('reason') reason: string, @Req() req) {
    if (req.user.role === UserRole.SUB_ADMIN && !req.user.permissions?.includes('MANAGE_SELLERS')) {
      throw new ForbiddenException('You do not have permission to modify sellers');
    }
    return this.adminService.rejectSeller(id, reason, req.user.userId, req.user.email);
  }

  @Put('users/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async updateUserStatus(@Param('id') id: string, @Body('isActive') isActive: boolean, @Req() req) {
    if (req.user.role === UserRole.SUB_ADMIN && !req.user.permissions?.includes('MANAGE_USERS')) {
      throw new ForbiddenException('You do not have permission to modify users');
    }
    return this.adminService.updateUserStatus(id, isActive, req.user.userId, req.user.email);
  }

  @Delete('users/:id')
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') id: string, @Req() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only primary super admin can delete user accounts');
    }
    return this.adminService.deleteUser(id, req.user.userId, req.user.email);
  }

  @Post('sub-admins')
  @Roles(UserRole.ADMIN) // ONLY primary admin can create sub-admins
  async createSubAdmin(@Body() data: any, @Req() req) {
    return this.adminService.createSubAdmin(data, req.user.userId, req.user.email);
  }

  @Put('sub-admins/:id')
  @Roles(UserRole.ADMIN)
  async updateSubAdmin(@Param('id') id: string, @Body() data: any, @Req() req) {
    return this.adminService.updateSubAdmin(id, data, req.user.userId, req.user.email);
  }

  @Delete('sub-admins/:id')
  @Roles(UserRole.ADMIN)
  async deleteSubAdmin(@Param('id') id: string, @Req() req) {
    return this.adminService.deleteSubAdmin(id, req.user.userId, req.user.email);
  }

  @Get('logs/activity')
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async getActivityLogs(@Req() req) {
    return this.adminService.getRecentActivity();
  }

  @Post('communications/send')
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async sendPromotionalEmail(@Body() data: { target: string, subject: string, message: string }, @Req() req) {
    if (req.user.role === UserRole.SUB_ADMIN && !req.user.permissions?.includes('SEND_COMMUNICATIONS')) {
      throw new ForbiddenException('You do not have permission to send communications');
    }
    return this.adminService.sendPromotionalEmail(data, req.user.userId, req.user.email);
  }

  @Post('seller/communications/send')
  @Roles(UserRole.SELLER)
  async sendSellerPromotionalEmail(@Body() data: { subject: string, message: string }, @Req() req) {
    const token = req.headers.authorization;
    return this.adminService.sendSellerPromotionalEmail(data, req.user.userId, req.user.email, token);
  }

  @Get('seller/buyers')
  @Roles(UserRole.SELLER)
  async getSellerBuyers(@Req() req) {
    const token = req.headers.authorization;
    return this.adminService.getSellerBuyersDetails(req.user.userId, token);
  }

  @Post('users/:id/reset-password')
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async resetUserPassword(@Param('id') id: string, @Body('password') password: string | undefined, @Req() req) {
    if (req.user.role === UserRole.SUB_ADMIN && !req.user.permissions?.includes('MANAGE_USERS')) {
      throw new ForbiddenException('You do not have permission to modify users');
    }
    return this.adminService.resetUserPassword(id, password, req.user.userId, req.user.email);
  }

  @Get('logs/technical')
  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  async getTechnicalLogs() {
    return this.adminService.getTechnicalLogs();
  }
}
