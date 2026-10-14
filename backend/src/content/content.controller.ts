import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/types/auth-user.js';
import { ContentService } from './content.service.js';
import { AnswerDto } from './dto/answer.dto.js';

function pickLang(header?: string): 'es' | 'en' {
  return header?.trim().toLowerCase().startsWith('en') ? 'en' : 'es';
}

@UseGuards(JwtAuthGuard)
@Controller('modules')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Headers('accept-language') lang?: string,
  ) {
    return this.contentService.listForUser(user.id, pickLang(lang));
  }

  @Get(':idOrSlug')
  get(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user: AuthUser,
    @Headers('accept-language') lang?: string,
  ) {
    return this.contentService.getForUser(idOrSlug, user.id, pickLang(lang));
  }

  @Get(':idOrSlug/questions')
  questions(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user: AuthUser,
    @Headers('accept-language') lang?: string,
  ) {
    return this.contentService.getQuestionsForUser(
      idOrSlug,
      user.id,
      pickLang(lang),
    );
  }

  @Post(':idOrSlug/answer')
  @HttpCode(HttpStatus.OK)
  answer(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AnswerDto,
  ) {
    return this.contentService.answer(
      idOrSlug,
      user.id,
      dto.question_id,
      dto.answer,
    );
  }
}
