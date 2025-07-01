export const $SourceCodeBuildWithLogsType = {
	properties: {
		image_name: {
	type: 'string',
	isRequired: true,
},
		repo_name_full_name: {
	type: 'string',
	isRequired: true,
},
		repo_name: {
	type: 'string',
	isRequired: true,
},
		pull_request_number: {
	type: 'string',
	isRequired: true,
},
		user_login: {
	type: 'string',
	isRequired: true,
},
		status: {
	type: 'string',
	isRequired: true,
},
		branch_name: {
	type: 'string',
	isRequired: true,
},
		logs: {
	type: 'array',
	contains: {
		type: 'SourceCodeBuildLogType',
	},
	isRequired: true,
},
	},
} as const;