export const $ContextPostPayload = {
	properties: {
		switch: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		create: {
	type: 'any-of',
	contains: [{
	type: 'CreateContextData',
}, {
	type: 'null',
}],
},
	},
} as const;