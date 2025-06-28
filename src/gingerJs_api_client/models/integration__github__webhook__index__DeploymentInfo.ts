import type { LastAndCurrentDeploymentInfo } from './LastAndCurrentDeploymentInfo';

export type integration__github__webhook__index__DeploymentInfo = {
	namespace: string;
	deployment_name: string;
	last_deployment: LastAndCurrentDeploymentInfo;
	current_deployment: LastAndCurrentDeploymentInfo;
};

