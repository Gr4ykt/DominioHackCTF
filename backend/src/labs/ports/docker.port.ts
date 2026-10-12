export interface CreateNetworkInput {
  name: string;
  subnet: string; // ej. 10.20.5.0/24
  gateway: string; // ej. 10.20.5.1
}

export interface RunContainerInput {
  image: string;
  name: string;
  sessionId: string;
  networkName: string;
  ip: string;
  /** Caps a añadir sobre un cap-drop ALL (mínimo por tipo de máquina). */
  capAdd?: string[];
  memoryMb: number;
  nanoCpus: number; // 1 CPU = 1_000_000_000
}

export interface ContainerState {
  exists: boolean;
  running: boolean;
  status: string;
}

export interface ManagedContainer {
  id: string;
  name: string;
  sessionId: string | null;
}

/** Puerto hacia el runtime de contenedores (dockerode + gVisor). */
export abstract class DockerPort {
  abstract createNetwork(input: CreateNetworkInput): Promise<void>;
  abstract removeNetwork(name: string): Promise<void>;
  /** Crea y arranca el contenedor bajo runsc. Devuelve su id. */
  abstract runContainer(input: RunContainerInput): Promise<string>;
  abstract inspect(containerId: string): Promise<ContainerState>;
  abstract destroy(containerId: string): Promise<void>;
  /** Contenedores gestionados por el motor (para limpieza al arrancar). */
  abstract listManaged(): Promise<ManagedContainer[]>;
}
