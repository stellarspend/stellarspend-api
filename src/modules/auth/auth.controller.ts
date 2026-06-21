import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with Stellar wallet signature' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Login successful, returns access and refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid signature or wallet not found' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'Refresh successful, returns new access and refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Get()
  @ApiOperation({ summary: 'Get auth module status' })
  @ApiResponse({ status: 200, description: 'Module status' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  status() {
    return this.authService.getStatus();
  }
}