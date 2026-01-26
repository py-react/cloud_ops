

export type DeploymentRunType = {
	pr_url?: string | null;
	jira?: string | null;
	images?: Record<string, string> | null;
	deployment_config_id: number;
	status?: string | null;
};

