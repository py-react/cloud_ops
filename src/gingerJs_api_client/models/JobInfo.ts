import type { PodInfo } from './PodInfo';

export type JobInfo = {
	component_type: string;
	job_name: string;
	pods: Array<PodInfo>;
};

