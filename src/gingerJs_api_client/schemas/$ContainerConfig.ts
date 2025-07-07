export const $ContainerConfig = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		command: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
		args: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
		workingDir: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		env: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'EnvVar',
	},
}, {
	type: 'null',
}],
},
		envFrom: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	type: 'dictionary',
	contains: {
	properties: {
	},
},
},
}, {
	type: 'null',
}],
},
		ports: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'ContainerPortConfig',
	},
}, {
	type: 'null',
}],
},
		resources: {
	type: 'any-of',
	contains: [{
	type: 'ResourceRequirements',
}, {
	type: 'null',
}],
},
		volumeMounts: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
		type: 'VolumeMount',
	},
}, {
	type: 'null',
}],
},
		livenessProbe: {
	type: 'any-of',
	contains: [{
	type: 'Probe',
}, {
	type: 'null',
}],
},
		readinessProbe: {
	type: 'any-of',
	contains: [{
	type: 'Probe',
}, {
	type: 'null',
}],
},
		startupProbe: {
	type: 'any-of',
	contains: [{
	type: 'Probe',
}, {
	type: 'null',
}],
},
		lifecycle: {
	type: 'any-of',
	contains: [{
	type: 'Lifecycle',
}, {
	type: 'null',
}],
},
		terminationMessagePath: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		terminationMessagePolicy: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		imagePullPolicy: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		securityContext: {
	type: 'any-of',
	contains: [{
	type: 'SecurityContext',
}, {
	type: 'null',
}],
},
		stdin: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		stdinOnce: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		tty: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
	},
} as const;