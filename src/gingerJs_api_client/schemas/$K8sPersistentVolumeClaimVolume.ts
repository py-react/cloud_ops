export const $K8sPersistentVolumeClaimVolume = {
	properties: {
		claimName: {
	type: 'string',
	isRequired: true,
},
		readOnly: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
	},
} as const;