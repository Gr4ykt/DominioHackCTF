import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LabsService } from './labs.service.js';

/** Expira los labs vencidos periódicamente (reemplaza a Bull/Redis). */
@Injectable()
export class LabsExpiration {
  private readonly logger = new Logger(LabsExpiration.name);
  private running = false;

  constructor(private readonly labs: LabsService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handle() {
    if (this.running) return; // evita solapes si una expiración tarda
    this.running = true;
    try {
      const n = await this.labs.expireDueSessions();
      if (n > 0) this.logger.log(`${n} laboratorio(s) expirado(s)`);
    } catch (error) {
      this.logger.error(`Job de expiración: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
