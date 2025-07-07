import type { PodAffinityTerm } from './PodAffinityTerm';

export type WeightedPodAffinityTerm = {
	weight: number;
	podAffinityTerm: PodAffinityTerm;
};

