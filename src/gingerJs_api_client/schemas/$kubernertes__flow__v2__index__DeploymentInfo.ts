export const $kubernertes__flow__v2__index__DeploymentInfo = {
	properties: {
		component_type: {
	type: 'string',
	isRequired: true,
},
		deployment_name: {
	type: 'string',
	isRequired: true,
},
		available_replicas: {
	type: 'number',
	isRequired: true,
},
		expected_replicas: {
	type: 'number',
	isRequired: true,
},
		pods: {
	type: 'array',
	contains: {
		type: 'PodInfo',
	},
	isRequired: true,
},
	},
} as const;