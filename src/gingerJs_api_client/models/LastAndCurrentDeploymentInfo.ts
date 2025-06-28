import type { DeploymentStageInfo } from './DeploymentStageInfo';

export type LastAndCurrentDeploymentInfo = {
	stage: DeploymentStageInfo;
	dev: DeploymentStageInfo;
	prod: DeploymentStageInfo;
};

