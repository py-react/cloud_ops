export const $IngressPath = {
	properties: {
		service_name: {
	type: 'string',
	isRequired: true,
},
		path: {
	type: 'string',
	isRequired: true,
},
		path_type: {
	type: 'string',
	isRequired: true,
},
	},
} as const;