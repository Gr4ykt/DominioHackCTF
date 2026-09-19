import { Module } from '@nestjs/common';
import { VpnService } from './vpn.service.js';
import { VpnController } from './vpn.controller.js';
import { WireguardService } from './wireguard.service.js';
import { PeerStoreService } from './peer-store.service.js';

@Module({
  controllers: [VpnController],
  providers: [VpnService, WireguardService, PeerStoreService],
})
export class VpnModule {}
