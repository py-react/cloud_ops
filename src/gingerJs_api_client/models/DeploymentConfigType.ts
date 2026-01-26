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
	status?: string;
	tag?: string | null;
	required_source_control?: boolean;
	code_source_control_name?: string | null;
	source_control_branch?: string | null;
	derived_deployment_id?: number | null;
	deployment_strategy_id?: number | null;
	replicas?: number | null;
	scheduling_profile_id?: number | null;
	container_profile_ids?: Array<number> | null;
	volume_profile_ids?: Array<number> | null;
	containers?: Array<ContainerConfig> | null;
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

