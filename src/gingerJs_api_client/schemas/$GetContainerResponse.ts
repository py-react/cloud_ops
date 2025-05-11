export const $GetContainerResponse = {
	properties: {
		containers: {
	type: 'array',
	contains: {
		type: 'ContainerInfo',
	},
	isRequired: true,
},
		length: {
	type: 'number',
	isRequired: true,
},
	},
} as const;