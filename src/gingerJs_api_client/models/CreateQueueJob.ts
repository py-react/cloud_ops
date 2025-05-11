import type { CreateQueueJobMeta } from './CreateQueueJobMeta';

export type CreateQueueJob = {
	queueName: string;
	meta: CreateQueueJobMeta;
	data: Record<string, unknown>;
};

