import type { NodeSelector } from './NodeSelector';
import type { PreferredSchedulingTerm } from './PreferredSchedulingTerm';

export type NodeAffinity = {
	requiredDuringSchedulingIgnoredDuringExecution?: NodeSelector | null;
	preferredDuringSchedulingIgnoredDuringExecution?: Array<PreferredSchedulingTerm> | null;
};

