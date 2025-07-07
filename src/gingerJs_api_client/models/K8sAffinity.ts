import type { NodeAffinity } from './NodeAffinity';
import type { PodAffinity } from './PodAffinity';
import type { PodAntiAffinity } from './PodAntiAffinity';

export type K8sAffinity = {
	nodeAffinity?: NodeAffinity | null;
	podAffinity?: PodAffinity | null;
	podAntiAffinity?: PodAntiAffinity | null;
};

