import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getVersion() {
    return {
      service: 'stellarspend-api',
      version: '1.0.0',
    };
  }
}
