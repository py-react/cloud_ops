export const $ContainerPortConfig = {
	properties: {
		containerPort: {
	type: 'number',
	isRequired: true,
},
		name: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		protocol: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;