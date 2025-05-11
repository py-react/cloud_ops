export const $CronJobInfo = {
	properties: {
		component_type: {
	type: 'string',
	isRequired: true,
},
		cronjob_name: {
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