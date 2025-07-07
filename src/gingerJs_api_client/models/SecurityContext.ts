

export type SecurityContext = {
	allowPrivilegeEscalation?: boolean | null;
	runAsNonRoot?: boolean | null;
	runAsUser?: number | null;
	readOnlyRootFilesystem?: boolean | null;
};

