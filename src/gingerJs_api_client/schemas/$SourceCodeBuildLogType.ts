export const $SourceCodeBuildLogType = {
	properties: {
		id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		build_id: {
	type: 'number',
	isRequired: true,
},
		logs: {
	type: 'string',
	isRequired: true,
},
		created_at: {
	type: 'any-of',
	contains: [{
	type: 'string',
	format: 'date-time',
}, {
	type: 'null',
}],
},
	},
} as const;