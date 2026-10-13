import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthUser } from '../auth/types/auth-user.js';
import { CreateMachineDto } from './dto/create-machine.dto.js';
import { UpdateMachineDto } from './dto/update-machine.dto.js';
import { MachinesService } from './machines.service.js';

// 'en' si el Accept-Language empieza por en; 'es' en cualquier otro caso.
function pickLang(header?: string): 'es' | 'en' {
  return header?.trim().toLowerCase().startsWith('en') ? 'en' : 'es';
}

@UseGuards(JwtAuthGuard)
@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.machinesService.listForUser(user.id);
  }

  // Antes de ':idOrSlug' para que 'catalog' no se interprete como un slug.
  @UseGuards(RolesGuard)
  @Roles('admin', 'superuser')
  @Get('catalog')
  catalog() {
    return this.machinesService.listAllForAdmin();
  }

  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string, @CurrentUser() user: AuthUser) {
    return this.machinesService.findOneForUser(idOrSlug, user.id);
  }

  @Get(':idOrSlug/writeup')
  writeup(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user: AuthUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.machinesService.getWriteup(
      idOrSlug,
      user.id,
      pickLang(acceptLanguage),
    );
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superuser')
  @Post()
  create(@Body() dto: CreateMachineDto) {
    return this.machinesService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superuser')
  @Patch(':idOrSlug')
  update(@Param('idOrSlug') idOrSlug: string, @Body() dto: UpdateMachineDto) {
    return this.machinesService.update(idOrSlug, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superuser')
  @Delete(':idOrSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('idOrSlug') idOrSlug: string) {
    return this.machinesService.remove(idOrSlug);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superuser')
  @Patch(':idOrSlug/toggle')
  toggle(@Param('idOrSlug') idOrSlug: string) {
    return this.machinesService.toggle(idOrSlug);
  }
}
