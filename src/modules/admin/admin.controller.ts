import { Controller, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';

class SuspendUserDto {
  reason?: string;
}

/**
 * Admin Controller
 * Provides administrative endpoints for user management
 */
@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Suspend a user account
   * @param id - User ID to suspend
   * @param dto - Suspension reason (optional)
   * @returns Suspended user details
   */
  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a user account' })
  @ApiParam({ name: 'id', description: 'User ID to suspend' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User already suspended' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async suspendUser(
    @Param('id') id: string,
    @Body() dto: SuspendUserDto,
  ) {
    const user = await this.usersService.suspend(id, dto.reason);
    return {
      message: 'User suspended successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Unsuspend a user account
   * @param id - User ID to unsuspend
   * @returns Unsuspended user details
   */
  @Post('users/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsuspend a user account' })
  @ApiParam({ name: 'id', description: 'User ID to unsuspend' })
  @ApiResponse({ status: 200, description: 'User unsuspended successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not suspended' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unsuspendUser(@Param('id') id: string) {
    const user = await this.usersService.unsuspend(id);
    return {
      message: 'User unsuspended successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
        updatedAt: user.updatedAt,
      },
    };
  }
}
