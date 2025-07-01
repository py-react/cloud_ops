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
		deployments: {
	type: 'any-of',
	description: `Mapping of repository names to deployment info`,
	contains: [{
	type: 'dictionary',
	contains: {
		type: 'integration__github__webhook__index__DeploymentInfo',
	},
}, {
	type: 'null',
}],
},
		timestamp: {
	type: 'string',
	description: `Current timestamp`,
	isRequired: true,
},
		builds: {
	type: 'dictionary',
	contains: {
	type: 'dictionary',
	contains: {
	type: 'any-of',
	contains: [{
	type: 'SourceCodeBuildWithLogsType',
}, {
	type: 'null',
}],
},
},
	isRequired: true,
},
	},
} as const;