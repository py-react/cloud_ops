import type { CronJobInfo } from './CronJobInfo';
import type { DaemonSetInfo } from './DaemonSetInfo';
import type { IngressInfo } from './IngressInfo';
import type { JobInfo } from './JobInfo';
import type { kubernertes__flow__v2__index__DeploymentInfo } from './kubernertes__flow__v2__index__DeploymentInfo';
import type { NodeInfo } from './NodeInfo';
import type { ServiceInfo } from './ServiceInfo';
import type { StatefulSetInfo } from './StatefulSetInfo';

export type NamespaceInfo = {
	ingresses?: Array<IngressInfo> | null;
	services?: Array<ServiceInfo> | null;
	deployments?: Array<kubernertes__flow__v2__index__DeploymentInfo> | null;
	statefulsets?: Array<StatefulSetInfo> | null;
	daemonsets?: Array<DaemonSetInfo> | null;
	cronJobs?: Array<CronJobInfo> | null;
	jobs?: Array<JobInfo> | null;
	nodes: Array<NodeInfo>;
};

