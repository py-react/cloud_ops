

export type PodInfo = {
	component_type: string;
	name: string;
	status: string;
	restarts: number;
	age: string;
	ip: string | null;
	node: string;
	resources: Record<string, Record<string, string>>;
};

