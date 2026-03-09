import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('version')
  @ApiOperation({ summary: 'Get API version' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns service name and version',
    schema: {
      type: 'object',
      properties: {
        service: { type: 'string', example: 'stellarspend-api' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  getVersion() {
    return this.appService.getVersion();
  }
}