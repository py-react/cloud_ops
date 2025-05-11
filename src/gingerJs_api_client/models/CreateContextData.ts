import type { CreateContextClusterData } from './CreateContextClusterData';
import type { CreateContextUserData } from './CreateContextUserData';

export type CreateContextData = {
	name: string;
	cluster: CreateContextClusterData;
	user: CreateContextUserData;
	namesapce?: string | null;
	set_current?: boolean | null;
	config_file?: string | null;
};

