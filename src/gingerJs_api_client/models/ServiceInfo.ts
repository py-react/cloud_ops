import type { CronJobInfo } from './CronJobInfo';
import type { DaemonSetInfo } from './DaemonSetInfo';
import type { JobInfo } from './JobInfo';
import type { kubernertes__flow__v2__index__DeploymentInfo } from './kubernertes__flow__v2__index__DeploymentInfo';
import type { StatefulSetInfo } from './StatefulSetInfo';

export type ServiceInfo = {
	component_type: string;
	service_name: string;
	type: string;
	clusterIP: string;
	externalIP: string;
	age: string;
	ports: Array<Record<string, unknown>>;
	deployments?: Array<kubernertes__flow__v2__index__DeploymentInfo>;
	daemonsets?: Array<DaemonSetInfo>;
	statefulsets?: Array<StatefulSetInfo>;
	jobs?: Array<JobInfo>;
	cronjobs?: Array<CronJobInfo>;
	node_names?: Array<string>;
	selector?: Record<string, string> | null;
};

