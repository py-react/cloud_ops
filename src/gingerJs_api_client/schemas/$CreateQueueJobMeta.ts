export const $CreateQueueJobMeta = {
	properties: {
		id: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		name: {
	type: 'string',
},
		delay: {
	type: 'number',
},
		attempts: {
	type: 'number',
},
		repeat: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
	},
} as const;