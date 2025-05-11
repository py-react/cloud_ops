export const $StatefulSetInfo = {
	properties: {
		component_type: {
	type: 'string',
	isRequired: true,
},
		statefulset_name: {
	type: 'string',
	isRequired: true,
},
		available_replicas: {
	type: 'number',
	isRequired: true,
},
		expected_replicas: {
	type: 'number',
	isRequired: true,
},
		pods: {
	type: 'array',
	contains: {
		type: 'PodInfo',
	},
	isRequired: true,
},
	},
} as const;