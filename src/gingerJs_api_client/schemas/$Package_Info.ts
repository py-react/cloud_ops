export const $Package_Info = {
	properties: {
		name: {
	type: 'array',
	contains: {
	type: 'string',
},
	isRequired: true,
},
		id: {
	type: 'string',
	isRequired: true,
},
		tags: {
	type: 'array',
	contains: {
	type: 'string',
},
	isRequired: true,
},
		created: {
	type: 'string',
	isRequired: true,
},
		size: {
	type: 'number',
	isRequired: true,
},
		virtual_size: {
	type: 'number',
	isRequired: true,
},
		repo_tags: {
	type: 'array',
	contains: {
	type: 'string',
},
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