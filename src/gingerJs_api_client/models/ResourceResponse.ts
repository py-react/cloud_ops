

export type ResourceResponse = {
	name: string;
	kind: string;
	namespaced: boolean;
	api_version: string;
	short_names: Array<string>;
	count?: number | null;
};

