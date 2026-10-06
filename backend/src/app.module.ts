import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { VpnModule } from './vpn/vpn.module.js';
import { LabsModule } from './labs/labs.module.js';
import { UsersModule } from './users/users.module.js';
import { ContentModule } from './content/content.module.js';
import { MachinesModule } from './machines/machines.module.js';
import { FlagsModule } from './flags/flags.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { validateEnv } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    AuthModule,
    VpnModule,
    LabsModule,
    UsersModule,
    ContentModule,
    MachinesModule,
    FlagsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
