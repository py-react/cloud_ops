import type { SourceCodeBuildLogType } from './SourceCodeBuildLogType';

export type SourceCodeBuildWithLogsType = {
	image_name: string;
	repo_name_full_name: string;
	repo_name: string;
	pull_request_number: string;
	user_login: string;
	status: string;
	branch_name: string;
	time_taken: number | null;
	created_at: string | null;
	logs: Array<SourceCodeBuildLogType>;
};

