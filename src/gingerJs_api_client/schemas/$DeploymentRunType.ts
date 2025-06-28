export const $DeploymentRunType = {
	properties: {
		pr_url: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		jira: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		image_name: {
	type: 'string',
	isRequired: true,
},
		deployment_config_id: {
	type: 'number',
	isRequired: true,
},
		status: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;