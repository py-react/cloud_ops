export const $K8sSecretVolume = {
	properties: {
		secretName: {
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