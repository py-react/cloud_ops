export const $Get_Packages_Response = {
	properties: {
		packages: {
	type: 'array',
	contains: {
		type: 'Package_Info',
	},
	isRequired: true,
},
	},
} as const;