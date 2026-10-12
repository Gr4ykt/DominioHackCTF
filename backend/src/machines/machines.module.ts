import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MachinesController } from './machines.controller.js';
import { MachinesService } from './machines.service.js';

@Module({
  imports: [AuthModule],
  controllers: [MachinesController],
  providers: [MachinesService],
  exports: [MachinesService],
})
export class MachinesModule {}
