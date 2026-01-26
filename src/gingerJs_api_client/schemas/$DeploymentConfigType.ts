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
		status: {
	type: 'string',
},
		tag: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		required_source_control: {
	type: 'boolean',
},
		code_source_control_name: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		source_control_branch: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		derived_deployment_id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		replicas: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		scheduling_profile_id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		container_profile_ids: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	type: 'number',
},
}, {
	type: 'null',
}],
},
		volume_profile_ids: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	type: 'number',
},
}, {
	type: 'null',
}],
},
		containers: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'ContainerConfig',
	},
}, {
	type: 'null',
}],
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
		node_selector: {
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
		tolerations: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'K8sToleration',
	},
}, {
	type: 'null',
}],
},
		affinity: {
	type: 'any-of',
	contains: [{
	type: 'K8sAffinity',
}, {
	type: 'null',
}],
},
		volumes: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'K8sVolume',
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
	format: 'date',
}, {
	type: 'null',
}],
},
		hard_delete: {
	type: 'boolean',
},
	},
} as const;