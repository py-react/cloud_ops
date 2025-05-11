import type { IngressPath } from './IngressPath';
import type { ServiceInfo } from './ServiceInfo';

export type IngressInfo = {
	component_type: string;
	ingress_name: string;
	host: string | null;
	paths: Array<IngressPath>;
	services?: Array<ServiceInfo> | null;
};

