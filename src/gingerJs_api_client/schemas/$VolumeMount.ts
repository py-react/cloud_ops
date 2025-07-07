export const $VolumeMount = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		mountPath: {
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