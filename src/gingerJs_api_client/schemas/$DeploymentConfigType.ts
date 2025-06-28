export const $DeploymentConfigType = {
	properties: {
		id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		type: {
	type: 'string',
	isRequired: true,
},
		namespace: {
	type: 'string',
	isRequired: true,
},
		deployment_name: {
	type: 'string',
	isRequired: true,
},
		tag: {
	type: 'string',
	isRequired: true,
},
		code_source_control_name: {
	type: 'string',
	isRequired: true,
},
		deployment_strategy_id: {
	type: 'number',
	isRequired: true,
},
		replicas: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		containers: {
	type: 'array',
	contains: {
		type: 'ContainerConfig',
	},
	isRequired: true,
},
		service_ports: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'ServicePortConfig',
	},
}, {
	type: 'null',
}],
},
		labels: {
	type: 'any-of',
	contains: [{
	type: 'dictionary',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
		annotations: {
	type: 'any-of',
	contains: [{
	type: 'dictionary',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
		soft_delete: {
	type: 'boolean',
},
		deleted_at: {
	type: 'any-of',
	contains: [{
	type: 'string',
	format: 'date-time',
}, {
	type: 'null',
}],
},
		hard_delete: {
	type: 'boolean',
},
	},
} as const;