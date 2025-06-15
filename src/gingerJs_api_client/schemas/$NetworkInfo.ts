export const $NetworkInfo = {
	properties: {
		Name: {
	type: 'string',
	isRequired: true,
},
		Id: {
	type: 'string',
	isRequired: true,
},
		Created: {
	type: 'string',
	isRequired: true,
},
		Scope: {
	type: 'string',
	isRequired: true,
},
		Driver: {
	type: 'string',
	isRequired: true,
},
		EnableIPv6: {
	type: 'boolean',
},
		IPAM: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
		Internal: {
	type: 'boolean',
},
		Attachable: {
	type: 'boolean',
},
		Ingress: {
	type: 'boolean',
},
		ConfigFrom: {
	type: 'dictionary',
	contains: {
	type: 'string',
},
},
		ConfigOnly: {
	type: 'boolean',
},
		Containers: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
		Options: {
	type: 'dictionary',
	contains: {
	type: 'string',
},
},
		Labels: {
	type: 'dictionary',
	contains: {
	type: 'string',
},
},
	},
} as const;