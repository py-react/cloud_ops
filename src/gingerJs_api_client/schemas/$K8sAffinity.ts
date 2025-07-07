export const $K8sAffinity = {
	properties: {
		nodeAffinity: {
	type: 'any-of',
	contains: [{
	type: 'NodeAffinity',
}, {
	type: 'null',
}],
},
		podAffinity: {
	type: 'any-of',
	contains: [{
	type: 'PodAffinity',
}, {
	type: 'null',
}],
},
		podAntiAffinity: {
	type: 'any-of',
	contains: [{
	type: 'PodAntiAffinity',
}, {
	type: 'null',
}],
},
	},
} as const;