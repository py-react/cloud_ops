import type { HealthCheck } from './HealthCheck';

export type DockerConfig = {
	image: string;
	detach?: boolean;
	remove?: boolean;
	privileged?: boolean;
	init?: boolean;
	tty?: boolean;
	stdinOpen?: boolean;
	readOnly?: boolean;
	ports?: Record<string, unknown>;
	volumes?: Array<Record<string, unknown>>;
	healthcheck?: HealthCheck | null;
	command?: string;
	name: string;
	auto_remove?: boolean;
	cpuShares?: string;
	memory?: string;
	memoryReservation?: string;
	memorySwap?: string;
};

