export const $NodeAffinity = {
	properties: {
		requiredDuringSchedulingIgnoredDuringExecution: {
	type: 'any-of',
	contains: [{
	type: 'NodeSelector',
}, {
	type: 'null',
}],
},
		preferredDuringSchedulingIgnoredDuringExecution: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'PreferredSchedulingTerm',
	},
}, {
	type: 'null',
}],
},
	},
} as const;