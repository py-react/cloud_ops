import type { ContainerInfo } from './ContainerInfo';

export type GetContainerResponse = {
	containers: Array<ContainerInfo>;
	length: number;
};

