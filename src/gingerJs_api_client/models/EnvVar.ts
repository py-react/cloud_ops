

export type EnvVar = {
	name: string;
	value?: string | null;
	value_from?: Record<string, unknown> | null;
};

