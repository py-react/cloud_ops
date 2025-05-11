export const $CreateContextClusterData = {
	properties: {
		server: {
	type: 'string',
	isRequired: true,
},
		certificate_authority_data: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		insecure_skip_tls_verify: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
	},
} as const;