

export type SwarmUpdateSpec = {
	rotate_worker_token?: boolean | null;
	rotate_manager_token?: boolean | null;
	rotate_manager_unlock_key?: boolean | null;
	force_new_cluster?: boolean | null;
	advertise_addr?: string | null;
	listen_addr?: string | null;
	default_addr_pool?: Array<unknown> | null;
	subnet_size?: number | null;
	task_history_retention_limit?: number | null;
	snapshot_interval?: number | null;
	keep_old_snapshots?: number | null;
	heartbeat_tick?: number | null;
	election_tick?: number | null;
	autolock_managers?: boolean | null;
	log_driver?: string | null;
};

