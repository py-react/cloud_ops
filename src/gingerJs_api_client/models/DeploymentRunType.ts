

export type DeploymentRunType = {
	pr_url?: string | null;
	jira?: string | null;
	images?: Record<string, string> | null;
	deployment_config_id: number;
	status?: string | null;
	apply_derived_service?: boolean | null;
	deployment_strategy_id?: number | null;
	http_route_id?: number | null;
	apply_derived_httproute?: boolean | null;
};

