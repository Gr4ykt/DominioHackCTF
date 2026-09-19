import { Controller } from '@nestjs/common';
import { VpnService } from './vpn.service.js';

@Controller('vpn')
export class VpnController {
  constructor(private readonly vpnService: VpnService) {}
}
