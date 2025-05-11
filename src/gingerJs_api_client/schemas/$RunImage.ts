export const $RunImage = {
	properties: {
		action: {
	type: 'string',
	isRequired: true,
},
		packageId: {
	type: 'string',
},
		pull_config: {
	type: 'PullConfig',
},
		create_config: {
	type: 'CreateConfig',
},
	},
} as const;