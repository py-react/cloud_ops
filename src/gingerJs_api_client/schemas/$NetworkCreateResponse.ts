export const $NetworkCreateResponse = {
	properties: {
		status: {
	type: 'string',
	isRequired: true,
},
		network: {
	type: 'NetworkInfo',
	isRequired: true,
},
	},
} as const;