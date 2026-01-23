import type { CronJobInfo } from './CronJobInfo';
import type { DaemonSetInfo } from './DaemonSetInfo';
import type { DeploymentInfo } from './DeploymentInfo';
import type { JobInfo } from './JobInfo';
import type { StatefulSetInfo } from './StatefulSetInfo';

export type ServiceInfo = {
	component_type: string;
	service_name: string;
	type: string;
	clusterIP: string;
	externalIP: string;
	age: string;
	ports: Array<Record<string, unknown>>;
	replicasets?: Array<DeploymentInfo>;
	deployments?: Array<DeploymentInfo>;
	daemonsets?: Array<DaemonSetInfo>;
	statefulsets?: Array<StatefulSetInfo>;
	jobs?: Array<JobInfo>;
	cronjobs?: Array<CronJobInfo>;
	node_names?: Array<string>;
	selector?: Record<string, string> | null;
};

