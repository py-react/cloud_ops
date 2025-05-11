

export type AddVolumeData = {
	name: string;
	driver: string;
	driverOpts: Record<string, unknown>;
	labels: Record<string, unknown>;
};

