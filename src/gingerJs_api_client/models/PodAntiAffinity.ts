import type { PodAffinityTerm } from './PodAffinityTerm';
import type { WeightedPodAffinityTerm } from './WeightedPodAffinityTerm';

export type PodAntiAffinity = {
	requiredDuringSchedulingIgnoredDuringExecution?: Array<PodAffinityTerm> | null;
	preferredDuringSchedulingIgnoredDuringExecution?: Array<WeightedPodAffinityTerm> | null;
};

