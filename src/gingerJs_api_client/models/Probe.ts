

export type Probe = {
	httpGet?: Record<string, unknown> | null;
	exec?: Record<string, unknown> | null;
	tcpSocket?: Record<string, unknown> | null;
	initialDelaySeconds?: number | null;
	periodSeconds?: number | null;
	timeoutSeconds?: number | null;
	successThreshold?: number | null;
	failureThreshold?: number | null;
};

