import { Module } from '@nestjs/common';
import { MachinesService } from './machines.service.js';
import { MachinesController } from './machines.controller.js';

@Module({
  controllers: [MachinesController],
  providers: [MachinesService],
})
export class MachinesModule {}
