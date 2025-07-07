export const $K8sConfigMapVolume = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		defaultMode: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		optional: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
	},
} as const;