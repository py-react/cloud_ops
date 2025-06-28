import type { PodInfo } from './PodInfo';

export type kubernertes__flow__v2__index__DeploymentInfo = {
	component_type: string;
	deployment_name: string;
	available_replicas: number;
	expected_replicas: number;
	pods: Array<PodInfo>;
};

