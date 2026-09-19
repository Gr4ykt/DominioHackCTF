import { Module } from '@nestjs/common';
import { LabsService } from './labs.service.js';
import { LabsController } from './labs.controller.js';
import { DockerService } from './docker.service.js';

@Module({
  controllers: [LabsController],
  providers: [LabsService, DockerService],
})
export class LabsModule {}
