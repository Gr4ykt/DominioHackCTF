import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/types/auth-user.js';
import { StartLabDto } from './dto/start-lab.dto.js';
import { LabsService } from './labs.service.js';

@UseGuards(JwtAuthGuard)
@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Post('start')
  start(@CurrentUser() user: AuthUser, @Body() dto: StartLabDto) {
    return this.labsService.start(user.id, dto.machine_id);
  }

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  stop(@CurrentUser() user: AuthUser) {
    return this.labsService.stop(user.id);
  }

  @Get('status')
  status(@CurrentUser() user: AuthUser) {
    return this.labsService.status(user.id);
  }

  @Post('extend')
  @HttpCode(HttpStatus.OK)
  extend(@CurrentUser() user: AuthUser) {
    return this.labsService.extend(user.id);
  }
}
