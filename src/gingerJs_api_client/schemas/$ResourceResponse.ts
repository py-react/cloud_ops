export const $ResourceResponse = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		kind: {
	type: 'string',
	isRequired: true,
},
		namespaced: {
	type: 'boolean',
	isRequired: true,
},
		api_version: {
	type: 'string',
	isRequired: true,
},
		short_names: {
	type: 'array',
	contains: {
	type: 'string',
},
	isRequired: true,
},
		count: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
	},
} as const;