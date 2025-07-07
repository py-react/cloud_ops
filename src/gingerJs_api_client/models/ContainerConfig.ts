import type { ContainerPortConfig } from './ContainerPortConfig';
import type { EnvVar } from './EnvVar';
import type { Lifecycle } from './Lifecycle';
import type { Probe } from './Probe';
import type { ResourceRequirements } from './ResourceRequirements';
import type { SecurityContext } from './SecurityContext';
import type { VolumeMount } from './VolumeMount';

export type ContainerConfig = {
	name: string;
	command?: Array<string> | null;
	args?: Array<string> | null;
	workingDir?: string | null;
	env?: Array<EnvVar> | null;
	envFrom?: Array<Record<string, unknown>> | null;
	ports?: Array<ContainerPortConfig> | null;
	resources?: ResourceRequirements | null;
	volumeMounts?: Array<VolumeMount> | null;
	livenessProbe?: Probe | null;
	readinessProbe?: Probe | null;
	startupProbe?: Probe | null;
	lifecycle?: Lifecycle | null;
	terminationMessagePath?: string | null;
	terminationMessagePolicy?: string | null;
	imagePullPolicy?: string | null;
	securityContext?: SecurityContext | null;
	stdin?: boolean | null;
	stdinOnce?: boolean | null;
	tty?: boolean | null;
};

