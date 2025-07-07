export const $PreferredSchedulingTerm = {
	properties: {
		weight: {
	type: 'number',
	isRequired: true,
},
		preference: {
	type: 'NodeSelectorTerm',
	isRequired: true,
},
	},
} as const;