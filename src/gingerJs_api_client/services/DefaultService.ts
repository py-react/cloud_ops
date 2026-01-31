import type { ApplyBody } from '../models/ApplyBody';
import type { ConfigUpdate } from '../models/ConfigUpdate';
import type { ContextPostData } from '../models/ContextPostData';
import type { CreateNamespacePayload } from '../models/CreateNamespacePayload';
import type { CreatePATRequest } from '../models/CreatePATRequest';
import type { CreateQueueJob } from '../models/CreateQueueJob';
import type { DeploymentConfigType } from '../models/DeploymentConfigType';
import type { DeploymentRunType } from '../models/DeploymentRunType';
import type { DockerConfigType } from '../models/DockerConfigType';
import type { GetContainerResponse } from '../models/GetContainerResponse';
import type { InfraCreateUpdateRequest } from '../models/InfraCreateUpdateRequest';
import type { InfraDeleteResponse } from '../models/InfraDeleteResponse';
import type { InfraPostResponse } from '../models/InfraPostResponse';
import type { InfraPutResponse } from '../models/InfraPutResponse';
import type { K8sContainerProfile } from '../models/K8sContainerProfile';
import type { K8sDeployment } from '../models/K8sDeployment';
import type { K8sDeploymentProfile } from '../models/K8sDeploymentProfile';
import type { K8sDeploymentSelectorProfile } from '../models/K8sDeploymentSelectorProfile';
import type { K8sEntityProfile } from '../models/K8sEntityProfile';
import type { K8sPod } from '../models/K8sPod';
import type { K8sPodMetaDataProfile } from '../models/K8sPodMetaDataProfile';
import type { K8sPodProfile } from '../models/K8sPodProfile';
import type { K8sService } from '../models/K8sService';
import type { K8sServiceMetadataProfile } from '../models/K8sServiceMetadataProfile';
import type { K8sServiceProfile } from '../models/K8sServiceProfile';
import type { K8sServiceSelectorProfile } from '../models/K8sServiceSelectorProfile';
import type { NamespaceInfo } from '../models/NamespaceInfo';
import type { NetworkCreateParams } from '../models/NetworkCreateParams';
import type { NetworkCreateResponse } from '../models/NetworkCreateResponse';
import type { NetworkDeleteParams } from '../models/NetworkDeleteParams';
import type { NetworkDeleteResponse } from '../models/NetworkDeleteResponse';
import type { NetworkListResponse } from '../models/NetworkListResponse';
import type { NetworkUpdateParams } from '../models/NetworkUpdateParams';
import type { nodes___node_id___NodeSpec } from '../models/nodes___node_id___NodeSpec';
import type { PATListItem } from '../models/PATListItem';
import type { PollingConfigRequest } from '../models/PollingConfigRequest';
import type { PollingStatusResponse } from '../models/PollingStatusResponse';
import type { RepoRequest } from '../models/RepoRequest';
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
import type { UpdatePATRequest } from '../models/UpdatePATRequest';
import type { VolumeActionRequest } from '../models/VolumeActionRequest';
import type { YAMLImportRequest } from '../models/YAMLImportRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export type TDataProxyApiDockerHubPathGet = {
                path: string
            }
export type TDataClusterProxyClusterProxyServiceNamespacePathPost = {
                namespace: string
path: string
service: string
            }
export type TDataClusterProxyClusterProxyServiceNamespacePathPost1 = {
                namespace: string
path: string
service: string
            }
export type TDataClusterProxyClusterProxyServiceNamespacePathPost2 = {
                namespace: string
path: string
service: string
            }
export type TDataClusterProxyClusterProxyServiceNamespacePathPost3 = {
                namespace: string
path: string
service: string
            }
export type TDataApiPackgesPost = {
                requestBody: RunImage
            }
export type TDataApiSettingsDockerConfigPost = {
                requestBody: DockerConfigType
            }
export type TDataApiSettingsDockerConfigPut = {
                id: number
requestBody: DockerConfigType
            }
export type TDataApiSettingsDockerConfigDelete = {
                id: number
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
export type TDataApiDockerStoragesPost = {
                requestBody: VolumeActionRequest
            }
export type TDataApiDockerNetworksPut = {
                requestBody: NetworkUpdateParams
            }
export type TDataApiDockerNetworksPost = {
                requestBody: NetworkCreateParams
            }
export type TDataApiDockerNetworksDelete = {
                requestBody: NetworkDeleteParams
            }
export type TDataApiDockerPackagesPost = {
                requestBody: RunImage
            }
export type TDataApiDockerRegistryGet = {
                blob?: boolean | null
imageName?: string | null
namespace?: string | null
serviceName?: string | null
servicePort?: number | null
sha256Digest?: string | null
tag?: string | null
            }
export type TDataApiDockerRegistryPost = {
                imageName: string
sourceTag: string
            }
export type TDataApiDockerRegistryExamineGet = {
                /**
 * Action: 'list' to show files, 'file' to extract file, 'config' to view config
 */
action?: string
/**
 * Path to file within layer (for action=file)
 */
filePath?: string | null
/**
 * Response format: 'json' or 'raw' (for file content)
 */
format?: string
/**
 * Repository name (e.g., github-webhook_test)
 */
repo: string
/**
 * SHA256 digest of the blob (without sha256: prefix)
 */
sha256: string
            }
export type TDataApiDockerContainersPost = {
                requestBody: RunContainer
            }
export type TDataApiDockerContainersStatsContainerIdGet = {
                containerId: string
            }
export type TDataApiDockerSystemsPost = {
                requestBody: SystemInfo
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
                requestBody: ApplyBody
            }
export type TDataApiKubernertesMethodsDeletePost = {
                requestBody: ApplyBody
            }
export type TDataApiKubernertesContextGet = {
                action: 'all' | 'current'
            }
export type TDataApiKubernertesContextPost = {
                requestBody: ContextPostData
            }
export type TDataApiKubernertesConfigmapsGet = {
                configmapName: string
namespace: string
            }
export type TDataApiKubernertesIngressGet = {
                ingressName?: string | null
namespace: string
            }
export type TDataApiKubernertesSecretsGet = {
                namespace: string
secretName?: string | null
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
export type TDataApiKubernertesUserGet = {
                namespace?: string | null
            }
export type TDataApiKubernertesPodsGet = {
                namespace: string
podName?: string | null
            }
export type TDataApiKubernertesServiceGet = {
                namespace: string
serviceName?: string | null
            }
export type TDataApiKubernertesLimitRangeGet = {
                namespace?: string | null
            }
export type TDataApiKubernertesResourceQuotaGet = {
                namespace?: string | null
            }
export type TDataApiKubernertesDeploymentsGet = {
                deploymentName?: string | null
namespace: string
resourceType?: string | null
            }
export type TDataApiKubernertesFlowV1Get = {
                namespace: string
            }
export type TDataApiKubernertesFlowV2Get = {
                namespace: string
            }
export type TDataApiIntegrationGithubReposPost = {
                requestBody: RepoRequest
            }
export type TDataApiIntegrationGithubReposPut = {
                requestBody: RepoRequest
            }
export type TDataApiIntegrationGithubReposDelete = {
                name: string
            }
export type TDataApiIntegrationGithubPollingPut = {
                requestBody: PollingConfigRequest
            }
export type TDataApiIntegrationGithubPollingDelete = {
                name: string
            }
export type TDataApiIntegrationGithubPollingAccessGet = {
                /**
 * full repo name owner/repo
 */
name: string
            }
export type TDataApiIntegrationGithubBuildsGet = {
                branchName: string
repoName: string
            }
export type TDataApiIntegrationGithubPatPost = {
                requestBody: CreatePATRequest
            }
export type TDataApiIntegrationGithubPatPut = {
                id: number
requestBody?: UpdatePATRequest | null
            }
export type TDataApiIntegrationGithubPatDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryPodGet = {
                namespace: string
            }
export type TDataApiIntegrationKubernetesLibraryPodPost = {
                requestBody: K8sPod
            }
export type TDataApiIntegrationKubernetesLibraryPodPut = {
                id: number
requestBody: K8sPod
            }
export type TDataApiIntegrationKubernetesLibraryPodDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentSelectorGet = {
                ids?: string | null
namespace?: string | null
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentSelectorPost = {
                requestBody: K8sDeploymentSelectorProfile
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentSelectorPut = {
                id: number
requestBody: K8sDeploymentSelectorProfile
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentSelectorDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentProfileGet = {
                ids?: string | null
namespace?: string | null
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentProfilePost = {
                requestBody: K8sDeploymentProfile
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentProfilePut = {
                id: number
requestBody: K8sDeploymentProfile
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentProfileDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryPodMetadataProfileGet = {
                ids?: string | null
namespace?: string | null
            }
export type TDataApiIntegrationKubernetesLibraryPodMetadataProfilePost = {
                requestBody: K8sPodMetaDataProfile
            }
export type TDataApiIntegrationKubernetesLibraryPodMetadataProfilePut = {
                id: number
requestBody: K8sPodMetaDataProfile
            }
export type TDataApiIntegrationKubernetesLibraryPodMetadataProfileDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryPodProfileGet = {
                ids?: string | null
namespace?: string | null
            }
export type TDataApiIntegrationKubernetesLibraryPodProfilePost = {
                requestBody: K8sPodProfile
            }
export type TDataApiIntegrationKubernetesLibraryPodProfilePut = {
                id: number
requestBody: K8sPodProfile
            }
export type TDataApiIntegrationKubernetesLibraryPodProfileDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryContainerGet = {
                ids?: string | null
namespace?: string | null
            }
export type TDataApiIntegrationKubernetesLibraryContainerPost = {
                requestBody: K8sContainerProfile
            }
export type TDataApiIntegrationKubernetesLibraryContainerPut = {
                id: number
requestBody: K8sContainerProfile
            }
export type TDataApiIntegrationKubernetesLibraryContainerDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryProfileGet = {
                ids?: string | null
namespace?: string | null
            }
export type TDataApiIntegrationKubernetesLibraryProfilePost = {
                requestBody: K8sEntityProfile
            }
export type TDataApiIntegrationKubernetesLibraryProfilePut = {
                id: number
requestBody: K8sEntityProfile
            }
export type TDataApiIntegrationKubernetesLibraryProfileDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentGet = {
                namespace: string
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentPost = {
                requestBody: K8sDeployment
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentPut = {
                id: number
requestBody: K8sDeployment
            }
export type TDataApiIntegrationKubernetesLibraryDeploymentDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryServiceGet = {
                namespace: string
            }
export type TDataApiIntegrationKubernetesLibraryServicePost = {
                requestBody: K8sService
            }
export type TDataApiIntegrationKubernetesLibraryServicePut = {
                id: number
requestBody: K8sService
            }
export type TDataApiIntegrationKubernetesLibraryServiceDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryServiceSelectorGet = {
                ids?: string | null
namespace: string
            }
export type TDataApiIntegrationKubernetesLibraryServiceSelectorPost = {
                requestBody: K8sServiceSelectorProfile
            }
export type TDataApiIntegrationKubernetesLibraryServiceSelectorPut = {
                id: number
requestBody: K8sServiceSelectorProfile
            }
export type TDataApiIntegrationKubernetesLibraryServiceSelectorDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryServiceProfileGet = {
                ids?: string | null
namespace: string
            }
export type TDataApiIntegrationKubernetesLibraryServiceProfilePost = {
                requestBody: K8sServiceProfile
            }
export type TDataApiIntegrationKubernetesLibraryServiceProfilePut = {
                id: number
requestBody: K8sServiceProfile
            }
export type TDataApiIntegrationKubernetesLibraryServiceProfileDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesLibraryServiceMetadataGet = {
                ids?: string | null
namespace: string
            }
export type TDataApiIntegrationKubernetesLibraryServiceMetadataPost = {
                requestBody: K8sServiceMetadataProfile
            }
export type TDataApiIntegrationKubernetesLibraryServiceMetadataPut = {
                id: number
requestBody: K8sServiceMetadataProfile
            }
export type TDataApiIntegrationKubernetesLibraryServiceMetadataDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesReleaseGet = {
                name?: string | null
namespace?: string | null
            }
export type TDataApiIntegrationKubernetesReleasePost = {
                requestBody: DeploymentConfigType
            }
export type TDataApiIntegrationKubernetesReleasePut = {
                requestBody: DeploymentConfigType
            }
export type TDataApiIntegrationKubernetesReleaseDelete = {
                name: string
namespace: string
            }
export type TDataApiIntegrationKubernetesReleaseRunGet = {
                configId: number
id?: number | null
            }
export type TDataApiIntegrationKubernetesReleaseRunPost = {
                requestBody: DeploymentRunType
            }
export type TDataApiIntegrationKubernetesReleaseRunPut = {
                id: number
requestBody: DeploymentRunType
            }
export type TDataApiIntegrationKubernetesReleaseRunDelete = {
                id: number
            }
export type TDataApiIntegrationKubernetesReleaseRunPatch = {
                id: number
status: string
            }
export type TDataApiIntegrationKubernetesServiceAccountGet = {
                namespace: string
            }
export type TDataApiIntegrationKubernetesImportYamlPost = {
                requestBody: YAMLImportRequest
            }
export type TDataApiQueuePost = {
                requestBody: RunQueue
            }
export type TDataApiQueueDelete = {
                requestBody: StopQueue
            }
export type TDataApiMonitoringWebhookTypeGet = {
                type: string
            }
export type TDataApiMonitoringWebhookTypePost = {
                type: string
            }
export type TDataApiMonitoringInstallGet = {
                component?: string
            }
export type TDataApiMonitoringInstallPost = {
                component?: string
            }
export type TDataApiMonitoringInstallDelete = {
                component?: string
            }
export type TDataApiMonitoringConfigGet = {
                component?: string
            }
export type TDataApiMonitoringConfigPost = {
                requestBody: ConfigUpdate
            }
export type TDataApiSystemsPost = {
                requestBody: SystemInfo
            }
export type TDataApiQueueJobPost = {
                requestBody: CreateQueueJob
            }

export class DefaultService {

	/**
	 * Proxy
	 * Proxy the GET request to Docker Hub registry without modifying the headers or body.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static proxyApiDockerHubPathGet(data: TDataProxyApiDockerHubPathGet): CancelablePromise<unknown> {
		const {
path,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/hub/{path}',
			path: {
				path
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Cluster Proxy
	 * Proxy requests to Kubernetes monitoring services (Prometheus/Grafana).
 * Handles authentication, URL construction, and content rewriting for assets.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static clusterProxyClusterProxyServiceNamespacePathPost(data: TDataClusterProxyClusterProxyServiceNamespacePathPost): CancelablePromise<unknown> {
		const {
namespace,
path,
service,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/cluster/proxy/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Cluster Proxy
	 * Proxy requests to Kubernetes monitoring services (Prometheus/Grafana).
 * Handles authentication, URL construction, and content rewriting for assets.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static clusterProxyClusterProxyServiceNamespacePathPost1(data: TDataClusterProxyClusterProxyServiceNamespacePathPost1): CancelablePromise<unknown> {
		const {
namespace,
path,
service,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/cluster/proxy/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Cluster Proxy
	 * Proxy requests to Kubernetes monitoring services (Prometheus/Grafana).
 * Handles authentication, URL construction, and content rewriting for assets.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static clusterProxyClusterProxyServiceNamespacePathPost2(data: TDataClusterProxyClusterProxyServiceNamespacePathPost2): CancelablePromise<unknown> {
		const {
namespace,
path,
service,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/cluster/proxy/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Cluster Proxy
	 * Proxy requests to Kubernetes monitoring services (Prometheus/Grafana).
 * Handles authentication, URL construction, and content rewriting for assets.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static clusterProxyClusterProxyServiceNamespacePathPost3(data: TDataClusterProxyClusterProxyServiceNamespacePathPost3): CancelablePromise<unknown> {
		const {
namespace,
path,
service,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/cluster/proxy/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
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
	public static apiSettingsDockerConfigGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/settings/docker/config',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSettingsDockerConfigPost(data: TDataApiSettingsDockerConfigPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/settings/docker/config',
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
	public static apiSettingsDockerConfigPut(data: TDataApiSettingsDockerConfigPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/settings/docker/config',
			query: {
				id
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
	public static apiSettingsDockerConfigDelete(data: TDataApiSettingsDockerConfigDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/settings/docker/config',
			query: {
				id
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
	public static apiDockerStoragesGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/storages',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiDockerStoragesPost(data: TDataApiDockerStoragesPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/docker/storages',
			body: requestBody,
			mediaType: 'application/json',
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
	public static apiDockerNetworksGet(): CancelablePromise<NetworkListResponse> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/networks',
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
	public static apiDockerNetworksPut(data: TDataApiDockerNetworksPut): CancelablePromise<NetworkCreateResponse> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/docker/networks',
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
	public static apiDockerNetworksPost(data: TDataApiDockerNetworksPost): CancelablePromise<NetworkCreateResponse> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/docker/networks',
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
	public static apiDockerNetworksDelete(data: TDataApiDockerNetworksDelete): CancelablePromise<NetworkDeleteResponse> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/docker/networks',
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
	public static apiDockerPackagesGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/packages',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiDockerPackagesPost(data: TDataApiDockerPackagesPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/docker/packages',
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
	public static apiDockerRegistryGet(data: TDataApiDockerRegistryGet = {}): CancelablePromise<unknown> {
		const {
blob,
imageName,
namespace,
serviceName,
servicePort,
sha256Digest,
tag,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/registry',
			query: {
				namespace, service_name: serviceName, service_port: servicePort, image_name: imageName, tag, blob, sha256_digest: sha256Digest
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Push a Docker image to the private registry
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiDockerRegistryPost(data: TDataApiDockerRegistryPost): CancelablePromise<unknown> {
		const {
imageName,
sourceTag,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/docker/registry',
			query: {
				image_name: imageName, source_tag: sourceTag
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Examine Docker registry blobs (layers and configs)
 * 
 * Examples:
 * - List layer contents: GET /examine?repo=github-webhook_test&sha256=9994ea1088e3f1d0eb3dea855f32e7e63742b2644c8611c124ba81bc3453047e&action=list
 * - Extract file: GET /examine?repo=github-webhook_test&sha256=9994ea1088e3f1d0eb3dea855f32e7e63742b2644c8611c124ba81bc3453047e&action=file&file_path=etc/passwd
 * - View config: GET /examine?repo=github-webhook_test&sha256=69efe5fc06316a533b5c4864d13f90abd41103a06af77ded188c7ba3f25937f4&action=config
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiDockerRegistryExamineGet(data: TDataApiDockerRegistryExamineGet): CancelablePromise<unknown> {
		const {
action = 'list',
filePath,
format = 'json',
repo,
sha256,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/registry/examine',
			query: {
				repo, sha256, action, file_path: filePath, format
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns GetContainerResponse Successful Response
	 * @throws ApiError
	 */
	public static apiDockerContainersGet(): CancelablePromise<GetContainerResponse> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/containers',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiDockerContainersPost(data: TDataApiDockerContainersPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/docker/containers',
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
	public static apiDockerContainersStatsContainerIdGet(data: TDataApiDockerContainersStatsContainerIdGet): CancelablePromise<unknown> {
		const {
containerId,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/containers/stats/{container_id}',
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
	public static apiDockerSystemsPost(data: TDataApiDockerSystemsPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/docker/systems',
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
	 * Get details for a specific configmap in a namespace.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesConfigmapsGet(data: TDataApiKubernertesConfigmapsGet): CancelablePromise<unknown> {
		const {
configmapName,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/configmaps',
			query: {
				namespace, configmap_name: configmapName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get detailed information for all ingress resources or a specific ingress in a namespace, with bubbled-up events.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesIngressGet(data: TDataApiKubernertesIngressGet): CancelablePromise<unknown> {
		const {
ingressName,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/ingress',
			query: {
				namespace, ingress_name: ingressName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get detailed information for all secrets or a specific secret in a namespace, with bubbled-up events.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesSecretsGet(data: TDataApiKubernertesSecretsGet): CancelablePromise<unknown> {
		const {
namespace,
secretName,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/secrets',
			query: {
				namespace, secret_name: secretName
			},
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
	 * Get detailed information for all pods or a specific pod in a namespace, with bubbled-up events.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesPodsGet(data: TDataApiKubernertesPodsGet): CancelablePromise<unknown> {
		const {
namespace,
podName,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/pods',
			query: {
				namespace, pod_name: podName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get detailed information for all services or a specific service in a namespace, with bubbled-up events.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesServiceGet(data: TDataApiKubernertesServiceGet): CancelablePromise<unknown> {
		const {
namespace,
serviceName,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/service',
			query: {
				namespace, service_name: serviceName
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
	 * FastAPI endpoint to get comprehensive namespace information with optional deployment filtering
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesDeploymentsGet(data: TDataApiKubernertesDeploymentsGet): CancelablePromise<unknown> {
		const {
deploymentName,
namespace,
resourceType,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/deployments',
			query: {
				namespace, deployment_name: deploymentName, resource_type: resourceType
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
	 * Add a new repository to the allowed list.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubReposPost(data: TDataApiIntegrationGithubReposPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/github/repos',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update branches for an existing repository.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubReposPut(data: TDataApiIntegrationGithubReposPut): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/github/repos',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete a repository and its configured branches.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubReposDelete(data: TDataApiIntegrationGithubReposDelete): CancelablePromise<unknown> {
		const {
name,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/github/repos',
			query: {
				name
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Return polling status and allowed repos/branches/builds.
	 * @returns PollingStatusResponse Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubPollingGet(): CancelablePromise<PollingStatusResponse> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/github/polling',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubPollingPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/github/polling',
		});
	}

	/**
	 * Update polling configuration for the running process (in-memory env).
 * 
 * Note: changes are applied to the running process environment only; update your deployment
 * configuration to persist across restarts.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubPollingPut(data: TDataApiIntegrationGithubPollingPut): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/github/polling',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Proxy delete to allowed-repo utils (keeps same contract as webhook DELETE).
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubPollingDelete(data: TDataApiIntegrationGithubPollingDelete): CancelablePromise<unknown> {
		const {
name,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/github/polling',
			query: {
				name
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Access-check route for a configured repo.
 * Uses the configured PAT for the repo (or active/fallback) to perform checks.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubPollingAccessGet(data: TDataApiIntegrationGithubPollingAccessGet): CancelablePromise<Record<string, unknown>> {
		const {
name,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/github/polling/access',
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
	public static apiIntegrationGithubBuildsGet(data: TDataApiIntegrationGithubBuildsGet): CancelablePromise<unknown> {
		const {
branchName,
repoName,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/github/builds',
			query: {
				repo_name: repoName, branch_name: branchName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns PATListItem Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubPatGet(): CancelablePromise<Array<PATListItem>> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/github/pat',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubPatPost(data: TDataApiIntegrationGithubPatPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/github/pat',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update PAT status or verify token
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationGithubPatPut(data: TDataApiIntegrationGithubPatPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/github/pat',
			query: {
				id
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
	public static apiIntegrationGithubPatDelete(data: TDataApiIntegrationGithubPatDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/github/pat',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryPodGet(data: TDataApiIntegrationKubernetesLibraryPodGet): CancelablePromise<unknown> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/pod',
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
	public static apiIntegrationKubernetesLibraryPodPost(data: TDataApiIntegrationKubernetesLibraryPodPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/pod',
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
	public static apiIntegrationKubernetesLibraryPodPut(data: TDataApiIntegrationKubernetesLibraryPodPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/pod',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryPodDelete(data: TDataApiIntegrationKubernetesLibraryPodDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/pod',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryDeploymentSelectorGet(data: TDataApiIntegrationKubernetesLibraryDeploymentSelectorGet = {}): CancelablePromise<unknown> {
		const {
ids,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/deployment_selector',
			query: {
				namespace, ids
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
	public static apiIntegrationKubernetesLibraryDeploymentSelectorPost(data: TDataApiIntegrationKubernetesLibraryDeploymentSelectorPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/deployment_selector',
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
	public static apiIntegrationKubernetesLibraryDeploymentSelectorPut(data: TDataApiIntegrationKubernetesLibraryDeploymentSelectorPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/deployment_selector',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryDeploymentSelectorDelete(data: TDataApiIntegrationKubernetesLibraryDeploymentSelectorDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/deployment_selector',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryDeploymentProfileGet(data: TDataApiIntegrationKubernetesLibraryDeploymentProfileGet = {}): CancelablePromise<unknown> {
		const {
ids,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/deployment_profile',
			query: {
				namespace, ids
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
	public static apiIntegrationKubernetesLibraryDeploymentProfilePost(data: TDataApiIntegrationKubernetesLibraryDeploymentProfilePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/deployment_profile',
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
	public static apiIntegrationKubernetesLibraryDeploymentProfilePut(data: TDataApiIntegrationKubernetesLibraryDeploymentProfilePut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/deployment_profile',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryDeploymentProfileDelete(data: TDataApiIntegrationKubernetesLibraryDeploymentProfileDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/deployment_profile',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryPodMetadataProfileGet(data: TDataApiIntegrationKubernetesLibraryPodMetadataProfileGet = {}): CancelablePromise<unknown> {
		const {
ids,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/pod_metadata_profile',
			query: {
				namespace, ids
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
	public static apiIntegrationKubernetesLibraryPodMetadataProfilePost(data: TDataApiIntegrationKubernetesLibraryPodMetadataProfilePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/pod_metadata_profile',
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
	public static apiIntegrationKubernetesLibraryPodMetadataProfilePut(data: TDataApiIntegrationKubernetesLibraryPodMetadataProfilePut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/pod_metadata_profile',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryPodMetadataProfileDelete(data: TDataApiIntegrationKubernetesLibraryPodMetadataProfileDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/pod_metadata_profile',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryPodProfileGet(data: TDataApiIntegrationKubernetesLibraryPodProfileGet = {}): CancelablePromise<unknown> {
		const {
ids,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/pod_profile',
			query: {
				namespace, ids
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
	public static apiIntegrationKubernetesLibraryPodProfilePost(data: TDataApiIntegrationKubernetesLibraryPodProfilePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/pod_profile',
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
	public static apiIntegrationKubernetesLibraryPodProfilePut(data: TDataApiIntegrationKubernetesLibraryPodProfilePut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/pod_profile',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryPodProfileDelete(data: TDataApiIntegrationKubernetesLibraryPodProfileDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/pod_profile',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryContainerGet(data: TDataApiIntegrationKubernetesLibraryContainerGet = {}): CancelablePromise<unknown> {
		const {
ids,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/container',
			query: {
				namespace, ids
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
	public static apiIntegrationKubernetesLibraryContainerPost(data: TDataApiIntegrationKubernetesLibraryContainerPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/container',
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
	public static apiIntegrationKubernetesLibraryContainerPut(data: TDataApiIntegrationKubernetesLibraryContainerPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/container',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryContainerDelete(data: TDataApiIntegrationKubernetesLibraryContainerDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/container',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryProfileGet(data: TDataApiIntegrationKubernetesLibraryProfileGet = {}): CancelablePromise<unknown> {
		const {
ids,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/profile',
			query: {
				namespace, ids
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
	public static apiIntegrationKubernetesLibraryProfilePost(data: TDataApiIntegrationKubernetesLibraryProfilePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/profile',
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
	public static apiIntegrationKubernetesLibraryProfilePut(data: TDataApiIntegrationKubernetesLibraryProfilePut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/profile',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryProfileDelete(data: TDataApiIntegrationKubernetesLibraryProfileDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/profile',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryDeploymentGet(data: TDataApiIntegrationKubernetesLibraryDeploymentGet): CancelablePromise<unknown> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/deployment',
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
	public static apiIntegrationKubernetesLibraryDeploymentPost(data: TDataApiIntegrationKubernetesLibraryDeploymentPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/deployment',
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
	public static apiIntegrationKubernetesLibraryDeploymentPut(data: TDataApiIntegrationKubernetesLibraryDeploymentPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/deployment',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryDeploymentDelete(data: TDataApiIntegrationKubernetesLibraryDeploymentDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/deployment',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryServiceGet(data: TDataApiIntegrationKubernetesLibraryServiceGet): CancelablePromise<unknown> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/service',
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
	public static apiIntegrationKubernetesLibraryServicePost(data: TDataApiIntegrationKubernetesLibraryServicePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/service',
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
	public static apiIntegrationKubernetesLibraryServicePut(data: TDataApiIntegrationKubernetesLibraryServicePut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/service',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryServiceDelete(data: TDataApiIntegrationKubernetesLibraryServiceDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/service',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryServiceSelectorGet(data: TDataApiIntegrationKubernetesLibraryServiceSelectorGet): CancelablePromise<unknown> {
		const {
ids,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/service/selector',
			query: {
				namespace, ids
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
	public static apiIntegrationKubernetesLibraryServiceSelectorPost(data: TDataApiIntegrationKubernetesLibraryServiceSelectorPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/service/selector',
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
	public static apiIntegrationKubernetesLibraryServiceSelectorPut(data: TDataApiIntegrationKubernetesLibraryServiceSelectorPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/service/selector',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryServiceSelectorDelete(data: TDataApiIntegrationKubernetesLibraryServiceSelectorDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/service/selector',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryServiceProfileGet(data: TDataApiIntegrationKubernetesLibraryServiceProfileGet): CancelablePromise<unknown> {
		const {
ids,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/service/profile',
			query: {
				namespace, ids
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
	public static apiIntegrationKubernetesLibraryServiceProfilePost(data: TDataApiIntegrationKubernetesLibraryServiceProfilePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/service/profile',
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
	public static apiIntegrationKubernetesLibraryServiceProfilePut(data: TDataApiIntegrationKubernetesLibraryServiceProfilePut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/service/profile',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryServiceProfileDelete(data: TDataApiIntegrationKubernetesLibraryServiceProfileDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/service/profile',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryServiceMetadataGet(data: TDataApiIntegrationKubernetesLibraryServiceMetadataGet): CancelablePromise<unknown> {
		const {
ids,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/library/service/metadata',
			query: {
				namespace, ids
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
	public static apiIntegrationKubernetesLibraryServiceMetadataPost(data: TDataApiIntegrationKubernetesLibraryServiceMetadataPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/library/service/metadata',
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
	public static apiIntegrationKubernetesLibraryServiceMetadataPut(data: TDataApiIntegrationKubernetesLibraryServiceMetadataPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/library/service/metadata',
			query: {
				id
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
	public static apiIntegrationKubernetesLibraryServiceMetadataDelete(data: TDataApiIntegrationKubernetesLibraryServiceMetadataDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/library/service/metadata',
			query: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get deployment details. Returns all non-hard-deleted items.
 * Frontend handles filtering by status/soft_delete.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationKubernetesReleaseGet(data: TDataApiIntegrationKubernetesReleaseGet = {}): CancelablePromise<unknown> {
		const {
name,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/release',
			query: {
				namespace, name
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create a new release configuration.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationKubernetesReleasePost(data: TDataApiIntegrationKubernetesReleasePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/release',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update an existing release configuration.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationKubernetesReleasePut(data: TDataApiIntegrationKubernetesReleasePut): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/release',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete a deployment and its associated service.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationKubernetesReleaseDelete(data: TDataApiIntegrationKubernetesReleaseDelete): CancelablePromise<unknown> {
		const {
name,
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/release',
			query: {
				namespace, name
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
	public static apiIntegrationKubernetesReleaseRunGet(data: TDataApiIntegrationKubernetesReleaseRunGet): CancelablePromise<unknown> {
		const {
configId,
id,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/release/run',
			query: {
				config_id: configId, id
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
	public static apiIntegrationKubernetesReleaseRunPost(data: TDataApiIntegrationKubernetesReleaseRunPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/release/run',
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
	public static apiIntegrationKubernetesReleaseRunPut(data: TDataApiIntegrationKubernetesReleaseRunPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/kubernetes/release/run',
			query: {
				id
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
	public static apiIntegrationKubernetesReleaseRunDelete(data: TDataApiIntegrationKubernetesReleaseRunDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/kubernetes/release/run',
			query: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update only the status of a deployment run.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationKubernetesReleaseRunPatch(data: TDataApiIntegrationKubernetesReleaseRunPatch): CancelablePromise<unknown> {
		const {
id,
status,
} = data;
		return __request(OpenAPI, {
			method: 'PATCH',
			url: '/api/integration/kubernetes/release/run',
			query: {
				id, status
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationKubernetesServiceAccountGet(data: TDataApiIntegrationKubernetesServiceAccountGet): CancelablePromise<Array<string>> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/service_account',
			query: {
				namespace
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Import Kubernetes resources from a YAML manifest.
 * Expected body: { "manifest": "..." }
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationKubernetesImportYamlPost(data: TDataApiIntegrationKubernetesImportYamlPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/import/yaml',
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
	 * Retrieve stored alert logs.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiMonitoringWebhookTypeGet(data: TDataApiMonitoringWebhookTypeGet): CancelablePromise<Record<string, unknown>> {
		const {
type,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/monitoring/webhook/{type}',
			path: {
				type
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Receives alerts, prints to terminal, and stores them in global memory.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiMonitoringWebhookTypePost(data: TDataApiMonitoringWebhookTypePost): CancelablePromise<Record<string, unknown>> {
		const {
type,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/monitoring/webhook/{type}',
			path: {
				type
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Check if a specific monitoring component is installed.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiMonitoringInstallGet(data: TDataApiMonitoringInstallGet = {}): CancelablePromise<Record<string, unknown>> {
		const {
component = 'prometheus',
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/monitoring/install',
			query: {
				component
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Deploy monitoring components.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiMonitoringInstallPost(data: TDataApiMonitoringInstallPost = {}): CancelablePromise<Record<string, unknown>> {
		const {
component = 'prometheus',
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/monitoring/install',
			query: {
				component
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete resources for a specific component.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiMonitoringInstallDelete(data: TDataApiMonitoringInstallDelete = {}): CancelablePromise<Record<string, unknown>> {
		const {
component = 'prometheus',
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/monitoring/install',
			query: {
				component
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Fetch the configuration for a specific component.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiMonitoringConfigGet(data: TDataApiMonitoringConfigGet = {}): CancelablePromise<Record<string, unknown>> {
		const {
component = 'alertmanager',
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/monitoring/config',
			query: {
				component
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update the configuration for a specific component.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiMonitoringConfigPost(data: TDataApiMonitoringConfigPost): CancelablePromise<Record<string, unknown>> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/monitoring/config',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Triggers test alerts using two modes:
 * 1. IMMEDIATE: Sends alerts directly to Alertmanager API (best-effort).
 * 2. REAL-WORLD: Deploys failing pods in alertmanager-test namespace.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiMonitoringTestAlertsPost(): CancelablePromise<Record<string, unknown>> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/monitoring/test-alerts',
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
	public static settingsDockerGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/docker',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsDockerConfigGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/docker/config',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdReleaseStrategiesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/release_strategies',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecPodGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/pod',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecPodProfileGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/pod/profile',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecPodMetadataGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/pod/metadata',
		});
	}

	/**
	 * Server-side rendering or logic for the Personal Access Tokens management page.
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecPatsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/pats',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecContainerGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/container',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecContainerProfileGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/container/profile',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecDeploymentGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/deployment',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecDeploymentSelectorGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/deployment/selector',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecDeploymentProfileGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/deployment/profile',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecServiceGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/service',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecServiceSelectorGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/service/selector',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecServiceProfileGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/service/profile',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdLibraryNamespaceSpecServiceMetadataGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{namespace}/spec/service/metadata',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdDeploymentStrategyGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/deployment_strategy',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdReleaseConfigGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/release_config',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdReleaseConfigNamespaceGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/release_config/{namespace}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdReleaseConfigNamespaceConfigNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/release_config/{namespace}/{config_name}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdSourceControlGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/source_control',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdSourceControlRepoNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/source_control/{repo_name}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdSourceControlRepoNameBranchNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/source_control/{repo_name}/{branch_name}',
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
	public static addonsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/addons',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static addonsAlertingGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/addons/alerting',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static addonsDashboardGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/addons/dashboard',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static addonsMonitoringGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/addons/monitoring',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static addonsLoggingGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/addons/logging',
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
	public static orchestrationKubernetesNamespaceGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceConfigmapsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/configmaps',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceConfigmapsNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/configmaps/{name}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceCertificateGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/certificate',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceSecretsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/secrets',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceSecretsNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/secrets/{name}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceResourcesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/resources',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceResourcesResourceTypeGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/resources/{resourceType}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceNamespaceGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/namespace',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceIngressesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/ingresses',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceIngressesNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/ingresses/{name}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacePodsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/pods',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespacePodsNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/pods/{name}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceIssuersGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/issuers',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceServicesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/services',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceServicesNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/services/{name}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceIssuerGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/issuer',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceDeploymentsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/deployments',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceDeploymentsTypeGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/deployments/{type}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceDeploymentsTypeNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/deployments/{type}/{name}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static orchestrationKubernetesNamespaceFlowGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/flow',
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

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static ceeGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static ceeDockerGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee/docker',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static ceeDockerStoragesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee/docker/storages',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static ceeDockerNetworkGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee/docker/network',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static ceeDockerContainerGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee/docker/container',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static ceeDockerPackagesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee/docker/packages',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static ceeDockerRegistryGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee/docker/registry',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static ceeDockerRegistryImageGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee/docker/registry/{image}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static ceeDockerRegistryImageTagGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee/docker/registry/{image}/{tag}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static ceeDockerHubGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee/docker/hub',
		});
	}

}