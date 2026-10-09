import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import type { Env } from '../config/env.validation.js';
import { WireguardCliAdapter } from './adapters/wireguard-cli.adapter.js';
import { WireguardDevAdapter } from './adapters/wireguard-dev.adapter.js';
import { VpnController } from './vpn.controller.js';
import { VpnService } from './vpn.service.js';
import { WireguardPort } from './wireguard.port.js';

@Module({
  imports: [AuthModule],
  controllers: [VpnController],
  providers: [
    VpnService,
    WireguardCliAdapter,
    WireguardDevAdapter,
    {
      // El adaptador se elige por WG_MODE: 'cli' toca wg0, 'dev' no.
      provide: WireguardPort,
      inject: [ConfigService, WireguardCliAdapter, WireguardDevAdapter],
      useFactory: (
        config: ConfigService<Env, true>,
        cli: WireguardCliAdapter,
        dev: WireguardDevAdapter,
      ) => (config.get('WG_MODE', { infer: true }) === 'cli' ? cli : dev),
    },
  ],
})
export class VpnModule {}
