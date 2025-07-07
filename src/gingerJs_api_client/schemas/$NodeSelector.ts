export const $NodeSelector = {
	properties: {
		nodeSelectorTerms: {
	type: 'array',
	contains: {
		type: 'NodeSelectorTerm',
	},
	isRequired: true,
},
	},
} as const;