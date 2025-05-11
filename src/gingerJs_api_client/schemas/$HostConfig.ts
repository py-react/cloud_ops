export const $HostConfig = {
	properties: {
		CpuShares: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
	isRequired: true,
},
		Memory: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
	isRequired: true,
},
		MemoryReservation: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
	isRequired: true,
},
		MemorySwap: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
	isRequired: true,
},
		PortBindings: {
	type: 'any-of',
	contains: [{
	type: 'dictionary',
	contains: {
	properties: {
	},
},
}, {
	type: 'null',
}],
	isRequired: true,
},
	},
} as const;