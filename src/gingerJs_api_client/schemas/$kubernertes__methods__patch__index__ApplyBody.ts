export const $kubernertes__methods__patch__index__ApplyBody = {
	properties: {
		manifest: {
	type: 'string',
	isRequired: true,
},
		op_name: {
	type: 'string',
	isRequired: true,
},
		data: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
	isRequired: true,
},
	},
} as const;