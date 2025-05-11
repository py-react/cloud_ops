export const $NodeInfo = {
	properties: {
		component_type: {
	type: 'string',
	isRequired: true,
},
		name: {
	type: 'string',
	isRequired: true,
},
		status: {
	type: 'string',
	isRequired: true,
},
		role: {
	type: 'string',
	isRequired: true,
},
		age: {
	type: 'string',
	isRequired: true,
},
		version: {
	type: 'string',
	isRequired: true,
},
		internalIP: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
	isRequired: true,
},
		externalIP: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
	isRequired: true,
},
		os: {
	type: 'string',
	isRequired: true,
},
		architecture: {
	type: 'string',
	isRequired: true,
},
		resources: {
	type: 'dictionary',
	contains: {
	type: 'dictionary',
	contains: {
	type: 'string',
},
},
	isRequired: true,
},
		conditions: {
	type: 'array',
	contains: {
	type: 'dictionary',
	contains: {
	type: 'string',
},
},
	isRequired: true,
},
	},
} as const;