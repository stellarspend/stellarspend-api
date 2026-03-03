import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService, CreateNotificationDto } from './notifications.service';

interface AuthenticatedRequest {
  user?: {
    id: string;
  };
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user notifications' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async getUserNotifications(@Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    return await this.notificationsService.findByUserId(req.user.id);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of unread notifications' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async getUnreadNotifications(@Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    return await this.notificationsService.findUnreadByUserId(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'title', 'message'],
      properties: {
        userId: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        message: { type: 'string' },
        type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
        category: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Notification created' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return await this.notificationsService.create(createNotificationDto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    return await this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for the authenticated user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async deleteNotification(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }
    await this.notificationsService.delete(id, req.user.id);
    return { message: 'Notification deleted successfully' };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get notifications module status' })
  @ApiResponse({ status: 200, description: 'Module status' })
  status() {
    return this.notificationsService.getStatus();
  }
}
