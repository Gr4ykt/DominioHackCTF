import { Module } from '@nestjs/common';
import { FlagsService } from './flags.service.js';
import { FlagsController } from './flags.controller.js';

@Module({
  controllers: [FlagsController],
  providers: [FlagsService],
})
export class FlagsModule {}
