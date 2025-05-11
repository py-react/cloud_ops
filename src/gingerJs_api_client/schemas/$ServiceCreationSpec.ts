export const $ServiceCreationSpec = {
	properties: {
		image: {
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
		constraints: {
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
		preferences: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	type: 'array',
	contains: {
	properties: {
	},
},
},
}, {
	type: 'null',
}],
},
		maxreplicas: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		container_labels: {
	type: 'any-of',
	contains: [{
	type: 'dictionary',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
		env: {
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
		hostname: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		init: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		isolation: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		labels: {
	type: 'any-of',
	contains: [{
	type: 'dictionary',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
		log_driver: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		mode: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		networks: {
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
		resources: {
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
},
		restart_policy: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		update_config: {
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
},
		rollback_config: {
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
},
		secrets: {
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
		stop_grace_period: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		workdir: {
	type: 'any-of',
	contains: [{
	type: 'string',
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
		open_stdin: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		read_only: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		stop_signal: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		healthcheck: {
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
},
		hosts: {
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
},
		dns_config: {
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
},
		configs: {
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
		privileges: {
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
},
		cap_add: {
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
		cap_drop: {
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
		sysctls: {
	type: 'any-of',
	contains: [{
	type: 'dictionary',
	contains: {
	type: 'string',
},
}, {
	type: 'null',
}],
},
	},
} as const;