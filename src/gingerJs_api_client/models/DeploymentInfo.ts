import type { PodInfo } from './PodInfo';

export type DeploymentInfo = {
	component_type: string;
	deployment_name: string;
	available_replicas: number;
	expected_replicas: number;
	pods: Array<PodInfo>;
};

