export const $SwarmJoinParams = {
	properties: {
		remote_addrs: {
	type: 'array',
	contains: {
	type: 'string',
},
	isRequired: true,
},
		join_token: {
	type: 'string',
	isRequired: true,
},
		listen_addr: {
	type: 'string',
},
		advertise_addr: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		data_path_addr: {
	type: 'string',
},
	},
} as const;