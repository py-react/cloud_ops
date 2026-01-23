export const $NamespaceInfo = {
	properties: {
		ingresses: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'IngressInfo',
	},
}, {
	type: 'null',
}],
},
		services: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'ServiceInfo',
	},
}, {
	type: 'null',
}],
},
		deployments: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'DeploymentInfo',
	},
}, {
	type: 'null',
}],
},
		statefulsets: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'StatefulSetInfo',
	},
}, {
	type: 'null',
}],
},
		daemonsets: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'DaemonSetInfo',
	},
}, {
	type: 'null',
}],
},
		cronJobs: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'CronJobInfo',
	},
}, {
	type: 'null',
}],
},
		jobs: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'JobInfo',
	},
}, {
	type: 'null',
}],
},
		nodes: {
	type: 'array',
	contains: {
		type: 'NodeInfo',
	},
	isRequired: true,
},
	},
} as const;