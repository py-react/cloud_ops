

export type EnvVar = {
	name: string;
	value?: string | null;
	valueFrom?: Record<string, unknown> | null;
};

