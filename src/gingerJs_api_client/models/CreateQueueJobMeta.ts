

export type CreateQueueJobMeta = {
	id?: string | null;
	name?: string;
	delay?: number;
	attempts?: number;
	repeat?: Record<string, unknown>;
};

