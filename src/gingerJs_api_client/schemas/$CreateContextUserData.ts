export const $CreateContextUserData = {
	properties: {
		token: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		client_certificate_data: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		client_key_data: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		username: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
	isRequired: true,
},
		password: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
	isRequired: true,
},
	},
} as const;