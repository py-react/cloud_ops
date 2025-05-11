export const $CreateContextData = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		cluster: {
	type: 'CreateContextClusterData',
	isRequired: true,
},
		user: {
	type: 'CreateContextUserData',
	isRequired: true,
},
		namesapce: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		set_current: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		config_file: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;