export const $ServiceInfo = {
	properties: {
		component_type: {
	type: 'string',
	isRequired: true,
},
		service_name: {
	type: 'string',
	isRequired: true,
},
		type: {
	type: 'string',
	isRequired: true,
},
		clusterIP: {
	type: 'string',
	isRequired: true,
},
		externalIP: {
	type: 'string',
	isRequired: true,
},
		age: {
	type: 'string',
	isRequired: true,
},
		ports: {
	type: 'array',
	contains: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
	isRequired: true,
},
		deployments: {
	type: 'array',
	contains: {
		type: 'DeploymentInfo',
	},
},
		daemonsets: {
	type: 'array',
	contains: {
		type: 'DaemonSetInfo',
	},
},
		statefulsets: {
	type: 'array',
	contains: {
		type: 'StatefulSetInfo',
	},
},
		jobs: {
	type: 'array',
	contains: {
		type: 'JobInfo',
	},
},
		cronjobs: {
	type: 'array',
	contains: {
		type: 'CronJobInfo',
	},
},
		node_names: {
	type: 'array',
	contains: {
	type: 'string',
},
},
		selector: {
	type: 'any-of',
	contains: [{
	type: 'dictionary',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
	},
} as const;