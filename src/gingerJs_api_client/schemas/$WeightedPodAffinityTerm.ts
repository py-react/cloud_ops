export const $WeightedPodAffinityTerm = {
	properties: {
		weight: {
	type: 'number',
	isRequired: true,
},
		podAffinityTerm: {
	type: 'PodAffinityTerm',
	isRequired: true,
},
	},
} as const;