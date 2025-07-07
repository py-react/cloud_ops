export const $PodAffinityTerm = {
	properties: {
		labelSelector: {
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
		namespaces: {
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
		topologyKey: {
	type: 'string',
	isRequired: true,
},
	},
} as const;