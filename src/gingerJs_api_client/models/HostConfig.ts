

export type HostConfig = {
	CpuShares: number | null;
	Memory: number | null;
	MemoryReservation: number | null;
	MemorySwap: number | null;
	PortBindings: Record<string, unknown> | null;
};

