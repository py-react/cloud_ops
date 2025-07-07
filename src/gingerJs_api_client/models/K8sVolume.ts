import type { K8sConfigMapVolume } from './K8sConfigMapVolume';
import type { K8sEmptyDirVolume } from './K8sEmptyDirVolume';
import type { K8sPersistentVolumeClaimVolume } from './K8sPersistentVolumeClaimVolume';
import type { K8sSecretVolume } from './K8sSecretVolume';

export type K8sVolume = {
	name: string;
	emptyDir?: K8sEmptyDirVolume | null;
	configMap?: K8sConfigMapVolume | null;
	secret?: K8sSecretVolume | null;
	persistentVolumeClaim?: K8sPersistentVolumeClaimVolume | null;
};

