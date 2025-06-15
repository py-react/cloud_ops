

export type NetworkUpdateParams = {
	/**
	 * ID of the network to update
	 */
	network_id: string;
	name?: string | null;
	driver?: string | null;
	scope?: string | null;
	options?: Record<string, unknown> | null;
	ipam?: Record<string, unknown> | null;
	internal?: boolean | null;
	labels?: Record<string, unknown> | null;
	enable_ipv6?: boolean | null;
	attachable?: boolean | null;
	ingress?: boolean | null;
};

