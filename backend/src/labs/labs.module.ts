import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import type { Env } from '../config/env.validation.js';
import { VpnModule } from '../vpn/vpn.module.js';
import { DockerAdapter } from './adapters/docker.adapter.js';
import { FirewallCliAdapter } from './adapters/firewall-cli.adapter.js';
import { FirewallDevAdapter } from './adapters/firewall-dev.adapter.js';
import { LabsController } from './labs.controller.js';
import { LabsExpiration } from './labs.expiration.js';
import { LabsService } from './labs.service.js';
import { DockerPort } from './ports/docker.port.js';
import { FirewallPort } from './ports/firewall.port.js';

@Module({
  imports: [AuthModule, VpnModule],
  controllers: [LabsController],
  providers: [
    LabsService,
    LabsExpiration,
    DockerAdapter,
    FirewallCliAdapter,
    FirewallDevAdapter,
    { provide: DockerPort, useExisting: DockerAdapter },
    {
      // El firewall se elige por FIREWALL_MODE: 'cli' aplica iptables, 'dev' no.
      provide: FirewallPort,
      inject: [ConfigService, FirewallCliAdapter, FirewallDevAdapter],
      useFactory: (
        config: ConfigService<Env, true>,
        cli: FirewallCliAdapter,
        dev: FirewallDevAdapter,
      ) => (config.get('FIREWALL_MODE', { infer: true }) === 'cli' ? cli : dev),
    },
  ],
  exports: [LabsService],
})
export class LabsModule {}
