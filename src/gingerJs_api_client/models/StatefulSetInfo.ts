import type { PodInfo } from './PodInfo';

export type StatefulSetInfo = {
	component_type: string;
	statefulset_name: string;
	available_replicas: number;
	expected_replicas: number;
	pods: Array<PodInfo>;
};

