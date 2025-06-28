export const $ServicePortConfig = {
	properties: {
		port: {
	type: 'number',
	isRequired: true,
},
		target_port: {
	type: 'number',
	isRequired: true,
},
		protocol: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;