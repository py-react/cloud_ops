import type { ContainerConfig } from './ContainerConfig';
import type { K8sAffinity } from './K8sAffinity';
import type { K8sToleration } from './K8sToleration';
import type { K8sVolume } from './K8sVolume';
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
	node_selector?: Record<string, string> | null;
	tolerations?: Array<K8sToleration> | null;
	affinity?: K8sAffinity | null;
	volumes?: Array<K8sVolume> | null;
	soft_delete?: boolean;
	deleted_at?: string | null;
	hard_delete?: boolean;
};

