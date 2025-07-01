export const $SourceCodeBuildLogType = {
	properties: {
		build_id: {
	type: 'number',
	isRequired: true,
},
		logs: {
	type: 'string',
	isRequired: true,
},
	},
} as const;