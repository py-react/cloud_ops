

export type Lifecycle = {
	preStop?: Record<string, unknown> | null;
	postStart?: Record<string, unknown> | null;
};

