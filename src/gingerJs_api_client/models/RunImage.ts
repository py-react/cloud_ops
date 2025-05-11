import type { CreateConfig } from './CreateConfig';
import type { PullConfig } from './PullConfig';

export type RunImage = {
	action: string;
	packageId?: string;
	pull_config?: PullConfig;
	create_config?: CreateConfig;
};

