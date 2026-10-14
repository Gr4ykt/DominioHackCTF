import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ContentAdminController } from './content-admin.controller.js';
import { ContentController } from './content.controller.js';
import { ContentService } from './content.service.js';

@Module({
  imports: [AuthModule],
  // El admin primero: 'catalog' debe registrarse antes de ':idOrSlug'.
  controllers: [ContentAdminController, ContentController],
  providers: [ContentService],
})
export class ContentModule {}
