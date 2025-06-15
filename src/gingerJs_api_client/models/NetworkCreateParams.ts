

export type NetworkCreateParams = {
	/**
	 * Name of the network to create
	 */
	name: string;
	/**
	 * Network driver to use
	 */
	driver?: string | null;
	/**
	 * Network driver options
	 */
	options?: Record<string, string> | null;
	/**
	 * IPAM configuration
	 */
	ipam?: Record<string, unknown> | null;
	/**
	 * Check for duplicate networks
	 */
	check_duplicate?: boolean | null;
	/**
	 * Create an internal network
	 */
	internal?: boolean | null;
	/**
	 * Network labels
	 */
	labels?: Record<string, string> | null;
	/**
	 * Enable IPv6
	 */
	enable_ipv6?: boolean | null;
	/**
	 * Make network attachable
	 */
	attachable?: boolean | null;
	/**
	 * Network scope
	 */
	scope?: string | null;
	/**
	 * Create an ingress network
	 */
	ingress?: boolean | null;
};

