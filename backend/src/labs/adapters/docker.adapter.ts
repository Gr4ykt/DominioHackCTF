import { Injectable, Logger } from '@nestjs/common';
import Docker from 'dockerode';
import {
  ContainerState,
  CreateNetworkInput,
  DockerPort,
  ManagedContainer,
  RunContainerInput,
} from '../ports/docker.port.js';

const LABEL_MANAGED = 'dhctf.managed';
const LABEL_SESSION = 'dhctf.session';
const RUNTIME = 'runsc';

@Injectable()
export class DockerAdapter extends DockerPort {
  private readonly logger = new Logger(DockerAdapter.name);
  private readonly docker = new Docker({ socketPath: '/var/run/docker.sock' });

  async createNetwork({ name, subnet, gateway }: CreateNetworkInput) {
    await this.docker.createNetwork({
      Name: name,
      Driver: 'bridge',
      CheckDuplicate: true,
      IPAM: { Config: [{ Subnet: subnet, Gateway: gateway }] },
      // Sin NAT de salida: el lab no tiene internet (validado en POC_RED).
      Options: { 'com.docker.network.bridge.enable_ip_masquerade': 'false' },
      Labels: { [LABEL_MANAGED]: 'true' },
    });
  }

  async removeNetwork(name: string) {
    try {
      await this.docker.getNetwork(name).remove();
    } catch (err) {
      if ((err as { statusCode?: number }).statusCode !== 404) throw err;
    }
  }

  async runContainer(input: RunContainerInput): Promise<string> {
    const container = await this.docker.createContainer({
      name: input.name,
      Image: input.image,
      Labels: { [LABEL_MANAGED]: 'true', [LABEL_SESSION]: input.sessionId },
      HostConfig: {
        Runtime: RUNTIME,
        // Mínimo privilegio: se quitan todas las capabilities y se añaden
        // solo las que la máquina necesita (RNF02 del informe).
        CapDrop: ['ALL'],
        CapAdd: input.capAdd ?? [],
        Memory: input.memoryMb * 1024 * 1024,
        NanoCpus: input.nanoCpus,
        // Sin puertos publicados: al lab solo se llega por la VPN.
        NetworkMode: input.networkName,
        RestartPolicy: { Name: 'no' },
      },
      NetworkingConfig: {
        EndpointsConfig: {
          [input.networkName]: { IPAMConfig: { IPv4Address: input.ip } },
        },
      },
    });
    await container.start();
    return container.id;
  }

  async inspect(containerId: string): Promise<ContainerState> {
    try {
      const info = await this.docker.getContainer(containerId).inspect();
      return {
        exists: true,
        running: info.State.Running,
        status: info.State.Status,
      };
    } catch (err) {
      if ((err as { statusCode?: number }).statusCode === 404) {
        return { exists: false, running: false, status: 'not-found' };
      }
      throw err;
    }
  }

  async destroy(containerId: string) {
    const container = this.docker.getContainer(containerId);
    try {
      await container.stop({ t: 3 });
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code !== 304 && code !== 404) throw err; // 304 ya detenido, 404 no existe
    }
    try {
      await container.remove({ force: true });
    } catch (err) {
      if ((err as { statusCode?: number }).statusCode !== 404) throw err;
    }
  }

  async listManaged(): Promise<ManagedContainer[]> {
    const containers = await this.docker.listContainers({
      all: true,
      filters: { label: [`${LABEL_MANAGED}=true`] },
    });
    return containers.map((c) => ({
      id: c.Id,
      name: c.Names[0]?.replace(/^\//, '') ?? c.Id,
      sessionId: c.Labels[LABEL_SESSION] ?? null,
    }));
  }
}
