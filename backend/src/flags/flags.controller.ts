import { Controller } from '@nestjs/common';
import { FlagsService } from './flags.service.js';

@Controller('flags')
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}
}
