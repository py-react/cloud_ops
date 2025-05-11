export const $PullConfig = {
	properties: {
		image: {
	type: 'string',
	isRequired: true,
},
		registry: {
	type: 'string',
},
	},
} as const;