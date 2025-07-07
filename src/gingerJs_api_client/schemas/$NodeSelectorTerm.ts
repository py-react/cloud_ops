export const $NodeSelectorTerm = {
	properties: {
		matchExpressions: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
}, {
	type: 'null',
}],
},
		matchFields: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
}, {
	type: 'null',
}],
},
	},
} as const;