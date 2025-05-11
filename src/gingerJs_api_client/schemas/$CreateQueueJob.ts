export const $CreateQueueJob = {
	properties: {
		queueName: {
	type: 'string',
	isRequired: true,
},
		meta: {
	type: 'CreateQueueJobMeta',
	isRequired: true,
},
		data: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
	isRequired: true,
},
	},
} as const;