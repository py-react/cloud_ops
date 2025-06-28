export const $EnvVar = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		value: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		value_from: {
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
},
	},
} as const;