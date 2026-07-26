import { Controller, Get, Post, Put, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { TicketService } from '../services/ticket.service';
import { CreateTicketDto, UpdateTicketStatusDto, AssignTicketDto, CreateMessageDto } from '../dto/ticket.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('support/tickets')
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(private ticketService: TicketService) {}

  @Post()
  async createTicket(@Body() createTicketDto: CreateTicketDto, @Req() req) {
    return this.ticketService.create(req.user, createTicketDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const frontendUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
      ? process.env.FRONTEND_URL.replace(/\/+$/, '')
      : 'https://microcart.me';
    const fileUrl = `${frontendUrl}/api/uploads/${file.filename}`;
    return { url: fileUrl };
  }

  @Get()
  async getTickets(@Req() req) {
    return this.ticketService.findAll(req.user);
  }

  @Get('unread/count')
  async getUnreadCount(@Req() req) {
    return this.ticketService.getUnreadCount(req.user);
  }

  @Get(':id')
  async getTicketById(@Param('id') id: string, @Req() req) {
    return this.ticketService.findOne(id, req.user);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTicketStatusDto,
    @Req() req,
  ) {
    return this.ticketService.updateStatus(id, updateStatusDto.status, req.user);
  }

  @Put(':id/assign')
  async assignTicket(
    @Param('id') id: string,
    @Body() assignTicketDto: AssignTicketDto,
    @Req() req,
  ) {
    return this.ticketService.assign(id, assignTicketDto.agentId, req.user);
  }

  // --- Message (Chat) Endpoints ---

  @Post(':id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req,
  ) {
    return this.ticketService.addMessage(id, createMessageDto, req.user);
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string, @Req() req) {
    return this.ticketService.findMessages(id, req.user);
  }
}
