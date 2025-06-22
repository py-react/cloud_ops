export const $resources___type___MetadataDict = {
	properties: {
		name: {
	type: 'string',
},
		namespace: {
	type: 'string',
},
		labels: {
	type: 'dictionary',
	contains: {
	type: 'string',
},
},
		annotations: {
	type: 'dictionary',
	contains: {
	type: 'string',
},
},
	},
} as const;