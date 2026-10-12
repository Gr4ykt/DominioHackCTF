import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/types/auth-user.js';
import { SubmitFlagDto } from './dto/submit-flag.dto.js';
import { FlagsService } from './flags.service.js';

// La ruta vive bajo /labs/flag (según ENDPOINTS).
@UseGuards(JwtAuthGuard)
@Controller('labs')
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}

  @Post('flag')
  @HttpCode(HttpStatus.OK)
  submit(
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitFlagDto,
    @Ip() ip: string,
  ) {
    return this.flagsService.submit(user.id, dto.flag, ip);
  }
}
