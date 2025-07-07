

export type PodAffinityTerm = {
	labelSelector?: Record<string, unknown> | null;
	namespaces?: Array<string> | null;
	topologyKey: string;
};

