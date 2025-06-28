export const $integration__github__webhook__index__DeploymentInfo = {
	properties: {
		namespace: {
	type: 'string',
	isRequired: true,
},
		deployment_name: {
	type: 'string',
	isRequired: true,
},
		last_deployment: {
	type: 'LastAndCurrentDeploymentInfo',
	isRequired: true,
},
		current_deployment: {
	type: 'LastAndCurrentDeploymentInfo',
	isRequired: true,
},
	},
} as const;