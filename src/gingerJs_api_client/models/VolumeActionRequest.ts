import type { AddVolumeData } from './AddVolumeData';
import type { VolumeActionEnum } from './VolumeActionEnum';

export type VolumeActionRequest = {
	action: VolumeActionEnum;
	volume_id?: string;
	add_data?: AddVolumeData;
};

