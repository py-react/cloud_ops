import type { PodInfo } from './PodInfo';

export type DaemonSetInfo = {
	component_type: string;
	daemonset_name: string;
	available_replicas: number;
	expected_replicas: number;
	pods: Array<PodInfo>;
};

