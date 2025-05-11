export const $HealthCheck = {
	properties: {
		test: {
	type: 'array',
	contains: {
	type: 'string',
},
},
		interval: {
	type: 'number',
},
		timeout: {
	type: 'number',
},
		retries: {
	type: 'number',
},
		startPeriod: {
	type: 'number',
},
	},
} as const;