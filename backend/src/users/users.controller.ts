import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthUser } from '../auth/types/auth-user.js';
import { ChangeRoleDto } from './dto/change-role.dto.js';
import { SetActiveDto } from './dto/set-active.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Público (B6): el leaderboard sirve de vitrina.
  @Get('leaderboard')
  leaderboard(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.usersService.leaderboard(Number(page), Number(limit));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superuser')
  @Get()
  list(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.usersService.listAll(Number(page), Number(limit));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  profile(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.publicProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.updateProfile(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/progress')
  progress(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.progress(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/flags')
  flags(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.flags(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superuser')
  @Patch(':id/role')
  changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.changeRole(id, dto.role, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superuser')
  @Patch(':id/active')
  setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.setActive(id, dto.is_active, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superuser')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.remove(id, user);
  }
}
