import { Controller } from '@nestjs/common';
import { MachinesService } from './machines.service.js';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}
}
