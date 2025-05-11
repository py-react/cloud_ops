import type { HostConfig } from './HostConfig';

export type ContainerInfo = {
	name: string;
	id: string;
	status: string;
	created: string;
	image: string;
	ports: Record<string, unknown> | null;
	command: Array<string> | null;
	state: Record<string, unknown>;
	exit_code: number | null;
	network: Record<string, unknown>;
	volumes: Array<Record<string, unknown>>;
	labels: Record<string, unknown>;
	env_vars: Array<string>;
	host_config: HostConfig;
};

