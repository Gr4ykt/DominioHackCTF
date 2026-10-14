import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ContentService } from './content.service.js';
import { CreateModuleDto } from './dto/create-module.dto.js';
import { SetQuestionsDto } from './dto/set-questions.dto.js';
import { UpdateModuleDto } from './dto/update-module.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superuser')
@Controller('modules')
export class ContentAdminController {
  constructor(private readonly contentService: ContentService) {}

  // 'catalog' antes de ':idOrSlug' (ver orden de controllers en el módulo).
  @Get('catalog')
  catalog() {
    return this.contentService.listAllForAdmin();
  }

  @Get(':idOrSlug/full')
  full(@Param('idOrSlug') idOrSlug: string) {
    return this.contentService.getFullForAdmin(idOrSlug);
  }

  @Post()
  create(@Body() dto: CreateModuleDto) {
    return this.contentService.create(dto);
  }

  @Patch(':idOrSlug')
  update(@Param('idOrSlug') idOrSlug: string, @Body() dto: UpdateModuleDto) {
    return this.contentService.update(idOrSlug, dto);
  }

  @Patch(':idOrSlug/toggle')
  toggle(@Param('idOrSlug') idOrSlug: string) {
    return this.contentService.toggle(idOrSlug);
  }

  @Delete(':idOrSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('idOrSlug') idOrSlug: string) {
    return this.contentService.remove(idOrSlug);
  }

  @Put(':idOrSlug/questions')
  setQuestions(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: SetQuestionsDto,
  ) {
    return this.contentService.setQuestions(idOrSlug, dto.questions);
  }
}
