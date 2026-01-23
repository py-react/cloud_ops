import type { SourceCodeBuildLogType } from './SourceCodeBuildLogType';

export type SourceCodeBuildWithLogsType = {
	image_name: string;
	repo_name_full_name: string;
	repo_name: string;
	pull_request_number: string;
	pr_head_sha: string | null;
	user_login: string;
	status: string;
	branch_name: string;
	base_branch_name: string;
	time_taken: number | null;
	created_at: string | null;
	logs: Array<SourceCodeBuildLogType>;
};

