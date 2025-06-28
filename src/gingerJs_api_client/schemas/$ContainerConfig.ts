export const $ContainerConfig = {
	properties: {
		name: {
	type: 'string',
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
},
		args: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
		env: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'EnvVar',
	},
}, {
	type: 'null',
}],
},
		ports: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'ServicePortConfig',
	},
}, {
	type: 'null',
}],
},
		resources: {
	type: 'any-of',
	contains: [{
	type: 'ResourceRequirements',
}, {
	type: 'null',
}],
},
	},
} as const;