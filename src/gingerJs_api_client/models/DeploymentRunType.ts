

export type DeploymentRunType = {
	pr_url?: string | null;
	jira?: string | null;
	image_name: string;
	deployment_config_id: number;
	status?: string | null;
};

