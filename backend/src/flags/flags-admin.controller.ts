import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { SetFlagsDto } from './dto/set-flags.dto.js';
import { FlagsService } from './flags.service.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superuser')
@Controller('flags')
export class FlagsAdminController {
  constructor(private readonly flagsService: FlagsService) {}

  @Get(':machineId')
  list(@Param('machineId', ParseUUIDPipe) machineId: string) {
    return this.flagsService.listForMachine(machineId);
  }

  @Put(':machineId')
  set(
    @Param('machineId', ParseUUIDPipe) machineId: string,
    @Body() dto: SetFlagsDto,
  ) {
    return this.flagsService.setFlags(machineId, dto.flags);
  }
}
