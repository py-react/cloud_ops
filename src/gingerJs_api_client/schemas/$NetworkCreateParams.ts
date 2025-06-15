export const $NetworkCreateParams = {
	properties: {
		name: {
	type: 'string',
	description: `Name of the network to create`,
	isRequired: true,
},
		driver: {
	type: 'any-of',
	description: `Network driver to use`,
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		options: {
	type: 'any-of',
	description: `Network driver options`,
	contains: [{
	type: 'dictionary',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
		ipam: {
	type: 'any-of',
	description: `IPAM configuration`,
	contains: [{
	type: 'dictionary',
	contains: {
	properties: {
	},
},
}, {
	type: 'null',
}],
},
		check_duplicate: {
	type: 'any-of',
	description: `Check for duplicate networks`,
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		internal: {
	type: 'any-of',
	description: `Create an internal network`,
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		labels: {
	type: 'any-of',
	description: `Network labels`,
	contains: [{
	type: 'dictionary',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
		enable_ipv6: {
	type: 'any-of',
	description: `Enable IPv6`,
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		attachable: {
	type: 'any-of',
	description: `Make network attachable`,
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		scope: {
	type: 'any-of',
	description: `Network scope`,
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		ingress: {
	type: 'any-of',
	description: `Create an ingress network`,
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
	},
} as const;