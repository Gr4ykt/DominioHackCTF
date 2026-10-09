import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/types/auth-user.js';
import { VpnService } from './vpn.service.js';

@UseGuards(JwtAuthGuard)
@Controller('vpn')
export class VpnController {
  constructor(private readonly vpnService: VpnService) {}

  // Descarga el .conf. Cada descarga genera un par de llaves nuevo e invalida
  // el anterior, así que el frontend solo debe llamarlo en una acción explícita.
  @Get('config')
  @Header('Content-Type', 'application/octet-stream')
  async downloadConfig(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const conf = await this.vpnService.issueConfig(user.id);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="dominiohackctf.conf"',
    );
    res.send(conf);
  }

  // Igual que /config: rota las llaves y entrega una config nueva.
  @Post('regenerate')
  @Header('Content-Type', 'application/octet-stream')
  async regenerate(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const conf = await this.vpnService.issueConfig(user.id);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="dominiohackctf.conf"',
    );
    res.send(conf);
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  status(@CurrentUser() user: AuthUser) {
    return this.vpnService.getStatus(user.id);
  }
}
