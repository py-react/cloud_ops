export const $SwarmInitParams = {
	properties: {
		advertise_addr: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		listen_addr: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		force_new_cluster: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		default_addr_pool: {
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
		subnet_size: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		data_path_addr: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		data_path_port: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		task_history_retention_limit: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		snapshot_interval: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		keep_old_snapshots: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		log_entries_for_slow_followers: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		heartbeat_tick: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		election_tick: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		dispatcher_heartbeat_period: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		node_cert_expiry: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		external_ca: {
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
		name: {
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
		signing_ca_cert: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		signing_ca_key: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		ca_force_rotate: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		autolock_managers: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
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
	},
} as const;