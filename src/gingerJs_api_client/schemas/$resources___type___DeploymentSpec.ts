export const $resources___type___DeploymentSpec = {
	properties: {
		replicas: {
	type: 'number',
},
		selector: {
	type: 'resources___type___Selector',
},
		template: {
	type: 'resources___type___PodTemplateSpec',
},
		strategy: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
	},
} as const;