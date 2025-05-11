

export type SwarmJoinParams = {
	remote_addrs: Array<string>;
	join_token: string;
	listen_addr?: string;
	advertise_addr?: string | null;
	data_path_addr?: string;
};

