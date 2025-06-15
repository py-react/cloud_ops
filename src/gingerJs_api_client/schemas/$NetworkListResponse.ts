export const $NetworkListResponse = {
	properties: {
		items: {
	type: 'array',
	contains: {
		type: 'NetworkInfo',
	},
	isRequired: true,
},
	},
} as const;