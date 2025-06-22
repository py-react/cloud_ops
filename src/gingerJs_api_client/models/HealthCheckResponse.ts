

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
	 * Current timestamp
	 */
	timestamp: string;
};

