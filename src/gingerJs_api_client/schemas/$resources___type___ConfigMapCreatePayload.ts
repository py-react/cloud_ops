export const $resources___type___ConfigMapCreatePayload = {
	properties: {
		metadata: {
	type: 'resources___type___MetadataDict',
},
		data: {
	type: 'dictionary',
	contains: {
	type: 'string',
},
},
		binaryData: {
	type: 'dictionary',
	contains: {
	type: 'string',
},
},
		immutable: {
	type: 'boolean',
},
	},
} as const;