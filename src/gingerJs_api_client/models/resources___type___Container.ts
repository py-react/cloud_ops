import type { resources___type___ContainerPort } from './resources___type___ContainerPort';

export type resources___type___Container = {
	name?: string;
	image?: string;
	ports?: Array<resources___type___ContainerPort>;
	env?: Array<Record<string, unknown>>;
	resources?: Record<string, unknown>;
	command?: Array<string>;
	args?: Array<string>;
};

