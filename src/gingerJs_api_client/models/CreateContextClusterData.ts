

export type CreateContextClusterData = {
	server: string;
	certificate_authority_data?: string | null;
	insecure_skip_tls_verify?: boolean | null;
};

