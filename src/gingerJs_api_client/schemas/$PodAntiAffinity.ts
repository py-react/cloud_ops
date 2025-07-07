export const $PodAntiAffinity = {
	properties: {
		requiredDuringSchedulingIgnoredDuringExecution: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'PodAffinityTerm',
	},
}, {
	type: 'null',
}],
},
		preferredDuringSchedulingIgnoredDuringExecution: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'WeightedPodAffinityTerm',
	},
}, {
	type: 'null',
}],
},
	},
} as const;