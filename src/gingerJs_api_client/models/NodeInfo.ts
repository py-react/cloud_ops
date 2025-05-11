

export type NodeInfo = {
	component_type: string;
	name: string;
	status: string;
	role: string;
	age: string;
	version: string;
	internalIP: string | null;
	externalIP: string | null;
	os: string;
	architecture: string;
	resources: Record<string, Record<string, string>>;
	conditions: Array<Record<string, string>>;
};

