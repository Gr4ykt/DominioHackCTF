import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import type { Env } from '../config/env.validation.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<Env, true>) {
    const connectionString = config.get('DATABASE_URL', { infer: true });
    // RDS (Aurora/PostgreSQL) rechaza conexiones sin cifrar ("no encryption"):
    // activamos SSL cuando la BD es de AWS. En local (Postgres del compose) no
    // hay SSL, así que se omite para no romper el entorno de desarrollo.
    const useSsl = /\.rds\.amazonaws\.com/.test(connectionString);
    super({
      adapter: new PrismaPg({
        connectionString,
        ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.$queryRaw`SELECT 1`;
    this.logger.log('Conectado a PostgreSQL');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
