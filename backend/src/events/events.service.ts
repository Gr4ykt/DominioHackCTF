import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, type Collection } from 'mongodb';
import type { Env } from '../config/env.validation.js';

export type ActivityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LAB_STARTED'
  | 'LAB_STOPPED'
  | 'LAB_EXPIRED'
  | 'FLAG_SUBMITTED';

export type LabEvent =
  'CONTAINER_STARTED' | 'CONTAINER_DESTROYED' | 'FLAG_ATTEMPT';

/**
 * Eventos append-only en MongoDB (observabilidad y KPIs). Si Mongo no está
 * disponible, se registra una advertencia pero NO se rompe la operación.
 */
@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private client?: MongoClient;
  private activity?: Collection;
  private labEvents?: Collection;

  constructor(private readonly config: ConfigService<Env, true>) {}

  async onModuleInit() {
    try {
      this.client = new MongoClient(
        this.config.get('MONGO_URI', { infer: true }),
        { serverSelectionTimeoutMS: 3000 },
      );
      await this.client.connect();
      const db = this.client.db();
      this.activity = db.collection('activity_logs');
      this.labEvents = db.collection('lab_events');
      this.logger.log('Conectado a MongoDB (eventos)');
    } catch (error) {
      this.logger.warn(`MongoDB no disponible: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.client?.close().catch(() => undefined);
  }

  logActivity(
    userId: string,
    action: ActivityAction,
    metadata: Record<string, unknown> = {},
    ipAddress?: string,
  ) {
    void this.activity
      ?.insertOne({
        user_id: userId,
        action,
        metadata,
        ip_address: ipAddress ?? null,
        timestamp: new Date(),
      })
      .catch((e) => this.logger.warn(`activity_logs: ${(e as Error).message}`));
  }

  logLabEvent(
    sessionId: string,
    event: LabEvent,
    detail: Record<string, unknown> = {},
  ) {
    void this.labEvents
      ?.insertOne({
        session_id: sessionId,
        event,
        detail,
        timestamp: new Date(),
      })
      .catch((e) => this.logger.warn(`lab_events: ${(e as Error).message}`));
  }
}
