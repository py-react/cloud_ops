export const $nodes___node_id___NodeSpec = {
	properties: {
		Availability: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		Role: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		Labels: {
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
		Constraints: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	properties: {
	},
},
}, {
	type: 'null',
}],
},
		Hostname: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;