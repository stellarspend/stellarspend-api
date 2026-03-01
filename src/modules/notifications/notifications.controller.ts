import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  UseGuards,
  Request,
  Req
} from '@nestjs/common';
import { NotificationsService, CreateNotificationDto } from './notifications.service';

interface AuthenticatedRequest {
  user?: {
    id: string;
  };
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    return await this.notificationsService.findByUserId(req.user.id);
  }

  @Get('unread')
  async getUnreadNotifications(@Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    return await this.notificationsService.findUnreadByUserId(req.user.id);
  }

  @Post()
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return await this.notificationsService.create(createNotificationDto);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    return await this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    await this.notificationsService.delete(id, req.user.id);
    return { message: 'Notification deleted successfully' };
  }

  @Get('status')
  status() {
    return this.notificationsService.getStatus();
  }
}
