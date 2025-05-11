export const $JobInfo = {
	properties: {
		component_type: {
	type: 'string',
	isRequired: true,
},
		job_name: {
	type: 'string',
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