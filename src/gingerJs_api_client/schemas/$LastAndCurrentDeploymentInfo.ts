export const $LastAndCurrentDeploymentInfo = {
	properties: {
		stage: {
	type: 'DeploymentStageInfo',
	isRequired: true,
},
		dev: {
	type: 'DeploymentStageInfo',
	isRequired: true,
},
		prod: {
	type: 'DeploymentStageInfo',
	isRequired: true,
},
	},
} as const;