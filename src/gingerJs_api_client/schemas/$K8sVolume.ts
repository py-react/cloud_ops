export const $K8sVolume = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		emptyDir: {
	type: 'any-of',
	contains: [{
	type: 'K8sEmptyDirVolume',
}, {
	type: 'null',
}],
},
		configMap: {
	type: 'any-of',
	contains: [{
	type: 'K8sConfigMapVolume',
}, {
	type: 'null',
}],
},
		secret: {
	type: 'any-of',
	contains: [{
	type: 'K8sSecretVolume',
}, {
	type: 'null',
}],
},
		persistentVolumeClaim: {
	type: 'any-of',
	contains: [{
	type: 'K8sPersistentVolumeClaimVolume',
}, {
	type: 'null',
}],
},
	},
} as const;