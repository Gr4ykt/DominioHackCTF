import { Controller } from '@nestjs/common';
import { LabsService } from './labs.service.js';

@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}
}
