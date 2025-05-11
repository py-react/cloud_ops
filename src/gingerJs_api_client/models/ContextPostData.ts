import type { ContextPostPayload } from './ContextPostPayload';
import type { ContextPostType } from './ContextPostType';

export type ContextPostData = {
	type: ContextPostType;
	payload: ContextPostPayload;
};

