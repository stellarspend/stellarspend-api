import { Module } from '@nestjs/common';
import { ProtectedController } from './protected.controller';
import { ProtectedService } from './protected.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProtectedController],
  providers: [ProtectedService],
  exports: [ProtectedService],
})
export class ProtectedModule {}
