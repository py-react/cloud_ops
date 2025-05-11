export const $IngressInfo = {
	properties: {
		component_type: {
	type: 'string',
	isRequired: true,
},
		ingress_name: {
	type: 'string',
	isRequired: true,
},
		host: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
	isRequired: true,
},
		paths: {
	type: 'array',
	contains: {
		type: 'IngressPath',
	},
	isRequired: true,
},
		services: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'ServiceInfo',
	},
}, {
	type: 'null',
}],
},
	},
} as const;