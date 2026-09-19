import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { VpnModule } from './vpn/vpn.module.js';
import { LabsModule } from './labs/labs.module.js';
import { UsersModule } from './users/users.module.js';
import { ContentModule } from './content/content.module.js';

@Module({
  imports: [AuthModule, VpnModule, LabsModule, UsersModule, ContentModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
