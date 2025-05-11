export const $InfraCreateUpdateRequest = {
	properties: {
		category: {
	type: 'string',
	isRequired: true,
},
		sub_category: {
	type: 'string',
	isRequired: true,
},
		project: {
	type: 'string',
	isRequired: true,
},
		file_name: {
	type: 'string',
	isRequired: true,
},
		content: {
	type: 'string',
	isRequired: true,
},
	},
} as const;