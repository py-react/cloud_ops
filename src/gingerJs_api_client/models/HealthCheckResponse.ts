import type { integration__github__webhook__index__DeploymentInfo } from './integration__github__webhook__index__DeploymentInfo';
import type { SourceCodeBuildWithLogsType } from './SourceCodeBuildWithLogsType';

/**
 * Response model for health check endpoint
 */
export type HealthCheckResponse = {
	/**
	 * Service status
	 */
	status?: string;
	/**
	 * List of supported event types
	 */
	supported_events: Array<string>;
	/**
	 * Mapping of repository names to repository identifiers
	 */
	allowed_repositories: Record<string, string>;
	/**
	 * Mapping of repository names to allowed branch lists
	 */
	allowed_branches: Record<string, Array<string>>;
	/**
	 * Mapping of repository names to deployment info
	 */
	deployments?: Record<string, integration__github__webhook__index__DeploymentInfo> | null;
	/**
	 * Current timestamp
	 */
	timestamp: string;
	builds: Record<string, Record<string, SourceCodeBuildWithLogsType | null>>;
};

