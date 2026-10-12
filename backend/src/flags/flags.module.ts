import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FlagsController } from './flags.controller.js';
import { FlagsService } from './flags.service.js';

@Module({
  imports: [AuthModule],
  controllers: [FlagsController],
  providers: [FlagsService],
})
export class FlagsModule {}
