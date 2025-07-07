import type { NodeSelectorTerm } from './NodeSelectorTerm';

export type PreferredSchedulingTerm = {
	weight: number;
	preference: NodeSelectorTerm;
};

