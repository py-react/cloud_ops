export const $SwarmUpdateSpec = {
	properties: {
		rotate_worker_token: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		rotate_manager_token: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
}, {
	type: 'null',
}],
},
		rotate_manager_unlock_key: {
	type: 'any-of',
	contains: [{
	type: 'boolean',
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
		default_addr_pool: {
	type: 'any-of',
	contains: [{
	type: 'array',
	contains: {
	properties: {
	},
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