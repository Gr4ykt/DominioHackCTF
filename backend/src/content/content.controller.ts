import { Controller } from '@nestjs/common';
import { ContentService } from './content.service.js';

@Controller('modules')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}
}
