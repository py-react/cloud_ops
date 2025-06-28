import type { ContainerConfig } from './ContainerConfig';
import type { ServicePortConfig } from './ServicePortConfig';

export type DeploymentConfigType = {
	id?: number | null;
	type: string;
	namespace: string;
	deployment_name: string;
	tag: string;
	code_source_control_name: string;
	deployment_strategy_id: number;
	replicas?: number | null;
	containers: Array<ContainerConfig>;
	service_ports?: Array<ServicePortConfig> | null;
	labels?: Record<string, string> | null;
	annotations?: Record<string, string> | null;
	soft_delete?: boolean;
	deleted_at?: string | null;
	hard_delete?: boolean;
};

