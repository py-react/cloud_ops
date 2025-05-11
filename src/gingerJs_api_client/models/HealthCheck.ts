

export type HealthCheck = {
	test?: Array<string>;
	interval?: number;
	timeout?: number;
	retries?: number;
	startPeriod?: number;
};

