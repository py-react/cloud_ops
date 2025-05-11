export const $CreateNamespacePayload = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
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
	},
} as const;