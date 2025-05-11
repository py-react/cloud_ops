

export type ServiceCreationSpec = {
	image: string;
	command?: Array<string> | null;
	args?: Array<string> | null;
	constraints?: Array<string> | null;
	preferences?: Array<Array<unknown>> | null;
	maxreplicas?: number | null;
	container_labels?: Record<string, string> | null;
	env?: Array<string> | null;
	hostname?: string | null;
	init?: boolean | null;
	isolation?: string | null;
	labels?: Record<string, string> | null;
	log_driver?: string | null;
	mode?: string | null;
	networks?: Array<string> | null;
	resources?: Record<string, unknown> | null;
	restart_policy?: string | null;
	update_config?: Record<string, unknown> | null;
	rollback_config?: Record<string, unknown> | null;
	secrets?: Array<string> | null;
	stop_grace_period?: number | null;
	workdir?: string | null;
	tty?: boolean | null;
	open_stdin?: boolean | null;
	read_only?: boolean | null;
	stop_signal?: string | null;
	healthcheck?: Record<string, unknown> | null;
	hosts?: Record<string, unknown> | null;
	dns_config?: Record<string, unknown> | null;
	configs?: Array<string> | null;
	privileges?: Record<string, unknown> | null;
	cap_add?: Array<string> | null;
	cap_drop?: Array<string> | null;
	sysctls?: Record<string, string> | null;
};

