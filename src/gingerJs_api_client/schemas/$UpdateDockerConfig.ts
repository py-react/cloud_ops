export const $UpdateDockerConfig = {
	properties: {
		cpuShares: {
	type: 'string',
},
		memory: {
	type: 'string',
},
		memoryReservation: {
	type: 'string',
},
		memorySwap: {
	type: 'string',
},
	},
} as const;