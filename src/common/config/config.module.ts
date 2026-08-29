import { Module } from '@nestjs/common';
import { TypedConfigService } from './typed-config.service';

@Module({
  providers: [TypedConfigService],
  exports: [TypedConfigService],
})
export class AppConfigModule {}