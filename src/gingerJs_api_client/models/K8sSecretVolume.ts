

export type K8sSecretVolume = {
	secretName: string;
	defaultMode?: number | null;
	optional?: boolean | null;
};

