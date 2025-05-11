export const $RunQueue = {
	properties: {
		queueName: {
	type: 'string',
	isRequired: true,
},
		prefix: {
	type: 'string',
	isRequired: true,
},
		processFileName: {
	type: 'string',
	isRequired: true,
},
		queueProps: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
	},
} as const;