import type { PodAffinityTerm } from './PodAffinityTerm';
import type { WeightedPodAffinityTerm } from './WeightedPodAffinityTerm';

export type PodAffinity = {
	requiredDuringSchedulingIgnoredDuringExecution?: Array<PodAffinityTerm> | null;
	preferredDuringSchedulingIgnoredDuringExecution?: Array<WeightedPodAffinityTerm> | null;
};

