export const $VolumeActionRequest = {
	properties: {
		action: {
	type: 'VolumeActionEnum',
	isRequired: true,
},
		volume_id: {
	type: 'string',
},
		add_data: {
	type: 'AddVolumeData',
},
	},
} as const;