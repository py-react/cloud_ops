

export type Package_Info = {
	name: Array<string>;
	id: string;
	tags: Array<string>;
	created: string;
	size: number;
	virtual_size: number;
	repo_tags: Array<string>;
	labels?: Record<string, string> | null;
};

