import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with Stellar wallet signature' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Login successful, returns access token' })
  @ApiResponse({ status: 401, description: 'Invalid signature or wallet not found' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get auth module status' })
  @ApiResponse({ status: 200, description: 'Module status' })
  status() {
    return this.authService.getStatus();
  }
}