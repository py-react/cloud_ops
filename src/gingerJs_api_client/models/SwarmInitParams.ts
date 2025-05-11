

export type SwarmInitParams = {
	advertise_addr?: string | null;
	listen_addr?: string | null;
	force_new_cluster?: boolean | null;
	default_addr_pool?: Array<string> | null;
	subnet_size?: number | null;
	data_path_addr?: string | null;
	data_path_port?: number | null;
	task_history_retention_limit?: number | null;
	snapshot_interval?: number | null;
	keep_old_snapshots?: number | null;
	log_entries_for_slow_followers?: number | null;
	heartbeat_tick?: number | null;
	election_tick?: number | null;
	dispatcher_heartbeat_period?: number | null;
	node_cert_expiry?: number | null;
	external_ca?: Record<string, unknown> | null;
	name?: string | null;
	labels?: Record<string, string> | null;
	signing_ca_cert?: string | null;
	signing_ca_key?: string | null;
	ca_force_rotate?: number | null;
	autolock_managers?: boolean | null;
	log_driver?: string | null;
};

