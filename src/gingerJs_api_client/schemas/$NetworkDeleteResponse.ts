export const $NetworkDeleteResponse = {
	properties: {
		status: {
	type: 'string',
	isRequired: true,
},
		network_id: {
	type: 'string',
	isRequired: true,
},
	},
} as const;