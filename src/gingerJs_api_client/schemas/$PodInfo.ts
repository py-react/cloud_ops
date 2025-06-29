export const $PodInfo = {
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
		restarts: {
	type: 'number',
	isRequired: true,
},
		age: {
	type: 'string',
	isRequired: true,
},
		ip: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
	isRequired: true,
},
		node: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
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
	},
} as const;