export const $AddVolumeData = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		driver: {
	type: 'string',
	isRequired: true,
},
		driverOpts: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
	isRequired: true,
},
		labels: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
	isRequired: true,
},
	},
} as const;