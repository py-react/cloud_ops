export const $HealthCheckResponse = {
	description: `Response model for health check endpoint`,
	properties: {
		status: {
	type: 'string',
	description: `Service status`,
},
		supported_events: {
	type: 'array',
	contains: {
	type: 'string',
},
	isRequired: true,
},
		allowed_repositories: {
	type: 'dictionary',
	contains: {
	type: 'string',
},
	isRequired: true,
},
		allowed_branches: {
	type: 'dictionary',
	contains: {
	type: 'array',
	contains: {
	type: 'string',
},
},
	isRequired: true,
},
		timestamp: {
	type: 'string',
	description: `Current timestamp`,
	isRequired: true,
},
	},
} as const;