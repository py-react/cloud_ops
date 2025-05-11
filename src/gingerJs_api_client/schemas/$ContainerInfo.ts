export const $ContainerInfo = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		id: {
	type: 'string',
	isRequired: true,
},
		status: {
	type: 'string',
	isRequired: true,
},
		created: {
	type: 'string',
	isRequired: true,
},
		image: {
	type: 'string',
	isRequired: true,
},
		ports: {
	type: 'any-of',
	contains: [{
	type: 'dictionary',
	contains: {
	properties: {
	},
},
}, {
	type: 'null',
}],
	isRequired: true,
},
		command: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
	isRequired: true,
},
		state: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
	isRequired: true,
},
		exit_code: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
	isRequired: true,
},
		network: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
	isRequired: true,
},
		volumes: {
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
		labels: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
	isRequired: true,
},
		env_vars: {
	type: 'array',
	contains: {
	type: 'string',
},
	isRequired: true,
},
		host_config: {
	type: 'HostConfig',
	isRequired: true,
},
	},
} as const;