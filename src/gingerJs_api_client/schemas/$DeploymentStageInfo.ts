export const $DeploymentStageInfo = {
	properties: {
		tag: {
	type: 'string',
	isRequired: true,
},
		pr_url: {
	type: 'string',
	isRequired: true,
},
		jira: {
	type: 'string',
	isRequired: true,
},
	},
} as const;