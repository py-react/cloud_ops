import type { resources___type___Container } from './resources___type___Container';

export type resources___type___PodSpec = {
	containers?: Array<resources___type___Container>;
	restartPolicy?: string;
	terminationGracePeriodSeconds?: number;
};

