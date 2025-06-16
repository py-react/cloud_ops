import type { ContextPostData } from '../models/ContextPostData';
import type { CreateNamespacePayload } from '../models/CreateNamespacePayload';
import type { CreateQueueJob } from '../models/CreateQueueJob';
import type { GetContainerResponse } from '../models/GetContainerResponse';
import type { InfraCreateUpdateRequest } from '../models/InfraCreateUpdateRequest';
import type { InfraDeleteResponse } from '../models/InfraDeleteResponse';
import type { InfraPostResponse } from '../models/InfraPostResponse';
import type { InfraPutResponse } from '../models/InfraPutResponse';
import type { kubernertes__methods__apply__index__ApplyBody } from '../models/kubernertes__methods__apply__index__ApplyBody';
import type { kubernertes__methods__delete__index__ApplyBody } from '../models/kubernertes__methods__delete__index__ApplyBody';
import type { kubernertes__methods__patch__index__ApplyBody } from '../models/kubernertes__methods__patch__index__ApplyBody';
import type { NamespaceInfo } from '../models/NamespaceInfo';
import type { NetworkCreateParams } from '../models/NetworkCreateParams';
import type { NetworkCreateResponse } from '../models/NetworkCreateResponse';
import type { NetworkDeleteParams } from '../models/NetworkDeleteParams';
import type { NetworkDeleteResponse } from '../models/NetworkDeleteResponse';
import type { NetworkListResponse } from '../models/NetworkListResponse';
import type { NetworkUpdateParams } from '../models/NetworkUpdateParams';
import type { nodes___node_id___NodeSpec } from '../models/nodes___node_id___NodeSpec';
import type { ResourceResponse } from '../models/ResourceResponse';
import type { ResourceScope } from '../models/ResourceScope';
import type { RunContainer } from '../models/RunContainer';
import type { RunImage } from '../models/RunImage';
import type { RunQueue } from '../models/RunQueue';
import type { ServiceCreationSpec } from '../models/ServiceCreationSpec';
import type { StopQueue } from '../models/StopQueue';
import type { SwarmInitParams } from '../models/SwarmInitParams';
import type { SwarmJoinParams } from '../models/SwarmJoinParams';
import type { SwarmUpdateSpec } from '../models/SwarmUpdateSpec';
import type { SystemInfo } from '../models/SystemInfo';
import type { VolumeActionRequest } from '../models/VolumeActionRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export type TDataApiPackgesPost = {
                requestBody: RunImage
            }
export type TDataApiSwarmInitPost = {
                requestBody: SwarmInitParams
            }
export type TDataApiSwarmJoinPost = {
                requestBody: SwarmJoinParams
            }
export type TDataApiSwarmUpdatePut = {
                requestBody: SwarmUpdateSpec
            }
export type TDataApiSwarmNodesNodeIdGet = {
                nodeId: string
            }
export type TDataApiSwarmNodesNodeIdPut = {
                nodeId: string
requestBody: nodes___node_id___NodeSpec
            }
export type TDataApiSwarmServicesGet = {
                filters?: unknown
            }
export type TDataApiSwarmServicesServiceIdGet = {
                serviceId: string
            }
export type TDataApiSwarmServicesCreatePost = {
                requestBody: ServiceCreationSpec
            }
export type TDataApiStoragesPost = {
                requestBody: VolumeActionRequest
            }
export type TDataApiInfraGet = {
                category: string
project?: string
searchTerm?: string
subCategory: string
            }
export type TDataApiInfraPost = {
                requestBody: InfraCreateUpdateRequest
            }
export type TDataApiInfraPut = {
                requestBody: InfraCreateUpdateRequest
            }
export type TDataApiInfraDelete = {
                category: string
fileName: string
project: string
subCategory: string
            }
export type TDataApiKubernertesClusterNamespaceGet = {
                labelSelector?: string | null
            }
export type TDataApiKubernertesClusterNamespacePost = {
                requestBody: CreateNamespacePayload
            }
export type TDataApiKubernertesClusterNamespaceDelete = {
                name: string
            }
export type TDataApiKubernertesMethodsGet = {
                type: string
            }
export type TDataApiKubernertesMethodsApplyPost = {
                requestBody: kubernertes__methods__apply__index__ApplyBody
            }
export type TDataApiKubernertesMethodsDeletePost = {
                requestBody: kubernertes__methods__delete__index__ApplyBody
            }
export type TDataApiKubernertesMethodsPatchPost = {
                requestBody: kubernertes__methods__patch__index__ApplyBody
            }
export type TDataApiKubernertesContextGet = {
                action: 'all' | 'current'
            }
export type TDataApiKubernertesContextPost = {
                requestBody: ContextPostData
            }
export type TDataApiKubernertesResourcesGet = {
                namespace?: string | null
resources?: string | null
scope?: ResourceScope | null
            }
export type TDataApiKubernertesResourcesTypeGet = {
                apiVersion?: string | null
fieldSelector?: string | null
labelSelector?: string | null
namespace?: string | null
type: string
            }
export type TDataApiKubernertesResourcesTypePost = {
                requestBody: Record<string, unknown>
type: string
            }
export type TDataApiKubernertesResourcesTypePut = {
                apiVersion: string
modifytype: string
name: string
namespace?: string | null
requestBody: Record<string, unknown>
type: string
            }
export type TDataApiKubernertesResourcesTypeDelete = {
                apiVersion: string
name: string
namespace?: string | null
type: string
            }
export type TDataApiKubernertesResourcesTypeCreatePost = {
                requestBody: Record<string, unknown>
type: string
            }
export type TDataApiKubernertesUserGet = {
                namespace?: string | null
            }
export type TDataApiKubernertesLimitRangeGet = {
                namespace?: string | null
            }
export type TDataApiKubernertesResourceQuotaGet = {
                namespace?: string | null
            }
export type TDataApiKubernertesDeploymentsGet = {
                namespace: string
            }
export type TDataApiKubernertesFlowV1Get = {
                namespace: string
            }
export type TDataApiKubernertesFlowV2Get = {
                namespace: string
            }
export type TDataApiNetworksPut = {
                requestBody: NetworkUpdateParams
            }
export type TDataApiNetworksPost = {
                requestBody: NetworkCreateParams
            }
export type TDataApiNetworksDelete = {
                requestBody: NetworkDeleteParams
            }
export type TDataApiQueuePost = {
                requestBody: RunQueue
            }
export type TDataApiQueueDelete = {
                requestBody: StopQueue
            }
export type TDataApiContainersPost = {
                requestBody: RunContainer
            }
export type TDataApiContainersStatsContainerIdGet = {
                containerId: string
            }
export type TDataApiSystemsPost = {
                requestBody: SystemInfo
            }
export type TDataApiQueueJobPost = {
                requestBody: CreateQueueJob
            }

export class DefaultService {

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiPackgesGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/packges',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiPackgesPost(data: TDataApiPackgesPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/packges',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSwarmInitPost(data: TDataApiSwarmInitPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/swarm/init',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSwarmJoinPost(data: TDataApiSwarmJoinPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/swarm/join',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSwarmUpdatePut(data: TDataApiSwarmUpdatePut): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/swarm/update',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSwarmUnlockKeyGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/swarm/unlock_key',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSwarmNodesNodeIdGet(data: TDataApiSwarmNodesNodeIdGet): CancelablePromise<unknown> {
		const {
nodeId,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/swarm/nodes/{node_id}',
			path: {
				node_id: nodeId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSwarmNodesNodeIdPut(data: TDataApiSwarmNodesNodeIdPut): CancelablePromise<unknown> {
		const {
nodeId,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/swarm/nodes/{node_id}',
			path: {
				node_id: nodeId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSwarmServicesGet(data: TDataApiSwarmServicesGet = {}): CancelablePromise<unknown> {
		const {
filters,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/swarm/services',
			query: {
				filters
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSwarmServicesServiceIdGet(data: TDataApiSwarmServicesServiceIdGet): CancelablePromise<unknown> {
		const {
serviceId,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/swarm/services/{service_id}',
			path: {
				service_id: serviceId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSwarmServicesCreatePost(data: TDataApiSwarmServicesCreatePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/swarm/services/create',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiStoragesGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/storages',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiStoragesPost(data: TDataApiStoragesPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/storages',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiInfraGet(data: TDataApiInfraGet): CancelablePromise<unknown> {
		const {
category,
project,
searchTerm,
subCategory,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/infra',
			query: {
				category, sub_category: subCategory, project, search_term: searchTerm
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns InfraPostResponse Successful Response
	 * @throws ApiError
	 */
	public static apiInfraPost(data: TDataApiInfraPost): CancelablePromise<InfraPostResponse> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/infra',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns InfraPutResponse Successful Response
	 * @throws ApiError
	 */
	public static apiInfraPut(data: TDataApiInfraPut): CancelablePromise<InfraPutResponse> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/infra',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns InfraDeleteResponse Successful Response
	 * @throws ApiError
	 */
	public static apiInfraDelete(data: TDataApiInfraDelete): CancelablePromise<InfraDeleteResponse> {
		const {
category,
fileName,
project,
subCategory,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/infra',
			query: {
				category, sub_category: subCategory, project, file_name: fileName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesClusterGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/cluster',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesClusterMetricsGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/cluster/metrics',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesClusterNamespaceGet(data: TDataApiKubernertesClusterNamespaceGet = {}): CancelablePromise<unknown> {
		const {
labelSelector,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/cluster/namespace',
			query: {
				label_selector: labelSelector
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesClusterNamespacePost(data: TDataApiKubernertesClusterNamespacePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/kubernertes/cluster/namespace',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesClusterNamespaceDelete(data: TDataApiKubernertesClusterNamespaceDelete): CancelablePromise<unknown> {
		const {
name,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/kubernertes/cluster/namespace',
			query: {
				name
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesMethodsGet(data: TDataApiKubernertesMethodsGet): CancelablePromise<unknown> {
		const {
type,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/methods',
			query: {
				type
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesMethodsApplyPost(data: TDataApiKubernertesMethodsApplyPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/kubernertes/methods/apply',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesMethodsDeletePost(data: TDataApiKubernertesMethodsDeletePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/kubernertes/methods/delete',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesMethodsPatchPost(data: TDataApiKubernertesMethodsPatchPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/kubernertes/methods/patch',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesContextGet(data: TDataApiKubernertesContextGet): CancelablePromise<unknown> {
		const {
action,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/context',
			query: {
				action
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Set a new Kubernetes context.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesContextPost(data: TDataApiKubernertesContextPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/kubernertes/context',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns ResourceResponse Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesResourcesGet(data: TDataApiKubernertesResourcesGet = {}): CancelablePromise<Array<ResourceResponse>> {
		const {
namespace,
resources,
scope,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/resources',
			query: {
				scope, resources, namespace
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesResourcesTypeGet(data: TDataApiKubernertesResourcesTypeGet): CancelablePromise<unknown> {
		const {
apiVersion,
fieldSelector,
labelSelector,
namespace,
type,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/resources/{type}',
			path: {
				type
			},
			query: {
				namespace, field_selector: fieldSelector, label_selector: labelSelector, api_version: apiVersion
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesResourcesTypePost(data: TDataApiKubernertesResourcesTypePost): CancelablePromise<unknown> {
		const {
requestBody,
type,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/kubernertes/resources/{type}',
			path: {
				type
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesResourcesTypePut(data: TDataApiKubernertesResourcesTypePut): CancelablePromise<unknown> {
		const {
apiVersion,
modifytype,
name,
namespace,
requestBody,
type,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/kubernertes/resources/{type}',
			path: {
				type
			},
			query: {
				apiVersion, name, modifytype, namespace
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesResourcesTypeDelete(data: TDataApiKubernertesResourcesTypeDelete): CancelablePromise<unknown> {
		const {
apiVersion,
name,
namespace,
type,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/kubernertes/resources/{type}',
			path: {
				type
			},
			query: {
				apiVersion, name, namespace
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesResourcesTypeCreatePost(data: TDataApiKubernertesResourcesTypeCreatePost): CancelablePromise<unknown> {
		const {
requestBody,
type,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/kubernertes/resources/{type}/create',
			path: {
				type
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesUserGet(data: TDataApiKubernertesUserGet = {}): CancelablePromise<unknown> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/user',
			query: {
				namespace
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesLimitRangeGet(data: TDataApiKubernertesLimitRangeGet = {}): CancelablePromise<unknown> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/limit-range',
			query: {
				namespace
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesResourceQuotaGet(data: TDataApiKubernertesResourceQuotaGet = {}): CancelablePromise<unknown> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/resource-quota',
			query: {
				namespace
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesDeploymentsGet(data: TDataApiKubernertesDeploymentsGet): CancelablePromise<unknown> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/deployments',
			query: {
				namespace
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesFlowV1Get(data: TDataApiKubernertesFlowV1Get): CancelablePromise<unknown> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/flow/v1',
			query: {
				namespace
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns NamespaceInfo Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesFlowV2Get(data: TDataApiKubernertesFlowV2Get): CancelablePromise<NamespaceInfo> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/flow/v2',
			query: {
				namespace
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * List all Docker networks.
 * 
 * Returns:
 * NetworkListResponse: List of network information
	 * @returns NetworkListResponse Successful Response
	 * @throws ApiError
	 */
	public static apiNetworksGet(): CancelablePromise<NetworkListResponse> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/networks',
		});
	}

	/**
	 * Update an existing Docker network by creating a new one with updated attributes
 * and removing the old one.
 * 
 * Args:
 * request: Request object
 * params: Network update parameters
 * 
 * Returns:
 * NetworkCreateResponse: Updated network information
 * 
 * Raises:
 * HTTPException: If network update fails
	 * @returns NetworkCreateResponse Successful Response
	 * @throws ApiError
	 */
	public static apiNetworksPut(data: TDataApiNetworksPut): CancelablePromise<NetworkCreateResponse> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/networks',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create a new Docker network.
 * 
 * Args:
 * params: Network creation parameters
 * 
 * Returns:
 * NetworkCreateResponse: Created network information
 * 
 * Raises:
 * HTTPException: If network creation fails
	 * @returns NetworkCreateResponse Successful Response
	 * @throws ApiError
	 */
	public static apiNetworksPost(data: TDataApiNetworksPost): CancelablePromise<NetworkCreateResponse> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/networks',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete a Docker network.
 * 
 * Args:
 * params: Network deletion parameters
 * 
 * Returns:
 * NetworkDeleteResponse: Deletion confirmation
 * 
 * Raises:
 * HTTPException: If network deletion fails
	 * @returns NetworkDeleteResponse Successful Response
	 * @throws ApiError
	 */
	public static apiNetworksDelete(data: TDataApiNetworksDelete): CancelablePromise<NetworkDeleteResponse> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/networks',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiQueueGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/queue',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiQueuePut(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/queue',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiQueuePost(data: TDataApiQueuePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/queue',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiQueueDelete(data: TDataApiQueueDelete): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/queue',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns GetContainerResponse Successful Response
	 * @throws ApiError
	 */
	public static apiContainersGet(): CancelablePromise<GetContainerResponse> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/containers',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiContainersPost(data: TDataApiContainersPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/containers',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiContainersStatsContainerIdGet(data: TDataApiContainersStatsContainerIdGet): CancelablePromise<unknown> {
		const {
containerId,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/containers/stats/{container_id}',
			path: {
				container_id: containerId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSystemsPost(data: TDataApiSystemsPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/systems',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiQueueJobGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/queueJob',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiQueueJobPut(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/queueJob',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiQueueJobPost(data: TDataApiQueueJobPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/queueJob',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiQueueJobDelete(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/queueJob',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static get(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsKubernetesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/kubernetes',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsKubernetesRbacGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/kubernetes/rbac',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsKubernetesContextsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/kubernetes/contexts',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsKubernetesNamespacesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/kubernetes/namespaces',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsKubernetesResourceQuotaGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/kubernetes/resource-quota',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static infraGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/infra',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static infraManagerGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/infra/manager',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static dockerGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/docker',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static dockerStoragesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/docker/storages',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static dockerNetworkGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/docker/network',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static dockerContainerGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/docker/container',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static dockerPackagesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/docker/packages',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static dockerHubGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/docker/hub',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationSwarmsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/swarms',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedConfigmapsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/configmaps',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedCertificateGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/certificate',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedIngressGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/ingress',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedSecretsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/secrets',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedResourcesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/resources',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedResourcesResourceTypeGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/resources/{resourceType}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedNamespaceGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/namespace',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedIngressesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/ingresses',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedPodsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/pods',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedDeploymentGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/deployment',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedIssuersGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/issuers',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedServicesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/services',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedIssuerGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/issuer',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedDeploymentsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/deployments',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacedFlowGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/namespaced/flow',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static queuesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/queues',
		});
	}

}