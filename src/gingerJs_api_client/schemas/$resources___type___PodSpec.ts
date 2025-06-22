export const $resources___type___PodSpec = {
	properties: {
		containers: {
	type: 'array',
	contains: {
		type: 'resources___type___Container',
	},
},
		restartPolicy: {
	type: 'string',
},
		terminationGracePeriodSeconds: {
	type: 'number',
},
	},
} as const;