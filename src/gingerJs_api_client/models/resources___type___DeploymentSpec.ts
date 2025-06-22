import type { resources___type___PodTemplateSpec } from './resources___type___PodTemplateSpec';
import type { resources___type___Selector } from './resources___type___Selector';

export type resources___type___DeploymentSpec = {
	replicas?: number;
	selector?: resources___type___Selector;
	template?: resources___type___PodTemplateSpec;
	strategy?: Record<string, unknown>;
};

