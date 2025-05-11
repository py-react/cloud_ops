export const $DockerConfig = {
	properties: {
		image: {
	type: 'string',
	isRequired: true,
},
		detach: {
	type: 'boolean',
},
		remove: {
	type: 'boolean',
},
		privileged: {
	type: 'boolean',
},
		init: {
	type: 'boolean',
},
		tty: {
	type: 'boolean',
},
		stdinOpen: {
	type: 'boolean',
},
		readOnly: {
	type: 'boolean',
},
		ports: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
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
},
		healthcheck: {
	type: 'any-of',
	contains: [{
	type: 'HealthCheck',
}, {
	type: 'null',
}],
},
		command: {
	type: 'string',
},
		name: {
	type: 'string',
	isRequired: true,
},
		auto_remove: {
	type: 'boolean',
},
		cpuShares: {
	type: 'string',
},
		memory: {
	type: 'string',
},
		memoryReservation: {
	type: 'string',
},
		memorySwap: {
	type: 'string',
},
	},
} as const;