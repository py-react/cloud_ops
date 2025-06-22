import type { resources___type___MetadataDict } from './resources___type___MetadataDict';

export type resources___type___ConfigMapCreatePayload = {
	metadata?: resources___type___MetadataDict;
	data?: Record<string, string>;
	binaryData?: Record<string, string>;
	immutable?: boolean;
};

