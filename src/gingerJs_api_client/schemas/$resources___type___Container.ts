export const $resources___type___Container = {
	properties: {
		name: {
	type: 'string',
},
		image: {
	type: 'string',
},
		ports: {
	type: 'array',
	contains: {
		type: 'resources___type___ContainerPort',
	},
},
		env: {
	type: 'array',
	contains: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
},
		resources: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
		command: {
	type: 'array',
	contains: {
	type: 'string',
},
},
		args: {
	type: 'array',
	contains: {
	type: 'string',
},
},
	},
} as const;