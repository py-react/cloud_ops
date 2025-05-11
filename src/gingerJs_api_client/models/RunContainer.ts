import type { DockerConfig } from './DockerConfig';
import type { DockerRequest } from './DockerRequest';
import type { UpdateDockerConfig } from './UpdateDockerConfig';

export type RunContainer = {
	action: 'run' | 'update' | 'rerun' | 'pause' | 'remove' | 'stop' | 'logs' | 'files' | 'command';
	containerId?: string | null;
	image?: string | null;
	dir?: DockerRequest | null;
	instanceConfig?: DockerConfig | null;
	updateInstanceConfig?: UpdateDockerConfig | null;
};


