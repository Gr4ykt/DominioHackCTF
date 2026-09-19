import { Controller } from '@nestjs/common';
import { ContentService } from './content.service.js';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}
}
