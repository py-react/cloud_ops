

export type NetworkInfo = {
	Name: string;
	Id: string;
	Created: string;
	Scope: string;
	Driver: string;
	EnableIPv6?: boolean;
	IPAM?: Record<string, unknown>;
	Internal?: boolean;
	Attachable?: boolean;
	Ingress?: boolean;
	ConfigFrom?: Record<string, string>;
	ConfigOnly?: boolean;
	Containers?: Record<string, unknown>;
	Options?: Record<string, string>;
	Labels?: Record<string, string>;
};

