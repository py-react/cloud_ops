import type { EnvVar } from './EnvVar';
import type { ResourceRequirements } from './ResourceRequirements';
import type { ServicePortConfig } from './ServicePortConfig';

export type ContainerConfig = {
	name: string;
	command?: Array<string> | null;
	args?: Array<string> | null;
	env?: Array<EnvVar> | null;
	ports?: Array<ServicePortConfig> | null;
	resources?: ResourceRequirements | null;
};

