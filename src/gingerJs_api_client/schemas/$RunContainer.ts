export const $RunContainer = {
	properties: {
		action: {
	type: 'Enum',
	isRequired: true,
},
		containerId: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		image: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		dir: {
	type: 'any-of',
	contains: [{
	type: 'DockerRequest',
}, {
	type: 'null',
}],
},
		instanceConfig: {
	type: 'any-of',
	contains: [{
	type: 'DockerConfig',
}, {
	type: 'null',
}],
},
		updateInstanceConfig: {
	type: 'any-of',
	contains: [{
	type: 'UpdateDockerConfig',
}, {
	type: 'null',
}],
},
	},
} as const;