export const $UpdateBranchesRequest = {
	properties: {
		repo_name: {
	type: 'string',
	isRequired: true,
},
		branches: {
	type: 'array',
	contains: {
	type: 'string',
},
	isRequired: true,
},
	},
} as const;