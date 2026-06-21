import { Controller, Get, Post, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import { QueryUsersDto } from './dto/query-users.dto';

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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly usersService: UsersService) { }

  /**
   * List all users with pagination
   * @param query - Pagination query parameters
   * @returns Paginated user list with metadata
   */
  @Get('users')
  @ApiOperation({ summary: 'List all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async listUsers(@Query() query: QueryUsersDto) {
    const result = await this.usersService.findAllPaginated(query.page, query.limit);

    return {
      success: true,
      data: result.data.map((user: User) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      meta: result.meta,
    };
  }

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
