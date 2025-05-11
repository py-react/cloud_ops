import type { PodInfo } from './PodInfo';

export type CronJobInfo = {
	component_type: string;
	cronjob_name: string;
	pods: Array<PodInfo>;
};

