export const $ContextPostData = {
	properties: {
		type: {
	type: 'ContextPostType',
	isRequired: true,
},
		payload: {
	type: 'ContextPostPayload',
	isRequired: true,
},
	},
} as const;