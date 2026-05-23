import type { ApplyBody } from '../models/ApplyBody';
import type { ConfigUpdate } from '../models/ConfigUpdate';
import type { ContextPostData } from '../models/ContextPostData';
import type { CreateAccessBody } from '../models/CreateAccessBody';
import type { CreateCredentialRequest } from '../models/CreateCredentialRequest';
import type { CreateQueueJob } from '../models/CreateQueueJob';
import type { CreateRegistryRequest } from '../models/CreateRegistryRequest';
import type { CredentialListItem } from '../models/CredentialListItem';
import type { DeleteRegistryRequest } from '../models/DeleteRegistryRequest';
import type { DeploymentConfigType } from '../models/DeploymentConfigType';
import type { DeploymentRunType } from '../models/DeploymentRunType';
import type { DockerConfigType } from '../models/DockerConfigType';
import type { GetContainerResponse } from '../models/GetContainerResponse';
import type { InfraCreateUpdateRequest } from '../models/InfraCreateUpdateRequest';
import type { InfraDeleteResponse } from '../models/InfraDeleteResponse';
import type { InfraPostResponse } from '../models/InfraPostResponse';
import type { InfraPutResponse } from '../models/InfraPutResponse';
import type { InstallLocalRequest } from '../models/InstallLocalRequest';
import type { KeyCreate } from '../models/KeyCreate';
import type { keys___keyId___DeployRequest } from '../models/keys___keyId___DeployRequest';
import type { keys___keyId___RetryRequest } from '../models/keys___keyId___RetryRequest';
import type { keys___keyId___RevokeRequest } from '../models/keys___keyId___RevokeRequest';
import type { LoadImageRequest } from '../models/LoadImageRequest';
import type { NetworkCreateParams } from '../models/NetworkCreateParams';
import type { NetworkCreateResponse } from '../models/NetworkCreateResponse';
import type { NetworkDeleteParams } from '../models/NetworkDeleteParams';
import type { NetworkDeleteResponse } from '../models/NetworkDeleteResponse';
import type { NetworkListResponse } from '../models/NetworkListResponse';
import type { NetworkUpdateParams } from '../models/NetworkUpdateParams';
import type { nodes___node_id___NodeSpec } from '../models/nodes___node_id___NodeSpec';
import type { OnboardingCompleteRequest } from '../models/OnboardingCompleteRequest';
import type { PollingConfigRequest } from '../models/PollingConfigRequest';
import type { PollingStatusResponse } from '../models/PollingStatusResponse';
import type { rbac___id___UpdateAccessBody } from '../models/rbac___id___UpdateAccessBody';
import type { RepoRequest } from '../models/RepoRequest';
import type { ResourceScope } from '../models/ResourceScope';
import type { RunContainer } from '../models/RunContainer';
import type { RunImage } from '../models/RunImage';
import type { RunQueue } from '../models/RunQueue';
import type { ServiceCreationSpec } from '../models/ServiceCreationSpec';
import type { StopQueue } from '../models/StopQueue';
import type { SwarmInitParams } from '../models/SwarmInitParams';
import type { SwarmJoinParams } from '../models/SwarmJoinParams';
import type { SwarmUpdateSpec } from '../models/SwarmUpdateSpec';
import type { SystemCreate } from '../models/SystemCreate';
import type { SystemInfo } from '../models/SystemInfo';
import type { UpdateCredentialRequest } from '../models/UpdateCredentialRequest';
import type { UpdateRegistryRequest } from '../models/UpdateRegistryRequest';
import type { VolumeActionRequest } from '../models/VolumeActionRequest';
import type { YAMLImportRequest } from '../models/YAMLImportRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export type TDataProxyApiDockerHubPathGet = {
                path: string
            }
export type TDataClusterProxyClusterProxyServiceNamespacePathDelete = {
                namespace: string
path: string
rewriteV2Location?: boolean
service: string
servicePort?: number
            }
export type TDataClusterProxyClusterProxyServiceNamespacePathDelete1 = {
                namespace: string
path: string
rewriteV2Location?: boolean
service: string
servicePort?: number
            }
export type TDataClusterProxyClusterProxyServiceNamespacePathDelete2 = {
                namespace: string
path: string
rewriteV2Location?: boolean
service: string
servicePort?: number
            }
export type TDataClusterProxyClusterProxyServiceNamespacePathDelete3 = {
                namespace: string
path: string
rewriteV2Location?: boolean
service: string
servicePort?: number
            }
export type TDataClusterProxyClusterProxyServiceNamespacePathDelete4 = {
                namespace: string
path: string
rewriteV2Location?: boolean
service: string
servicePort?: number
            }
export type TDataClusterProxyClusterProxyServiceNamespacePathDelete5 = {
                namespace: string
path: string
rewriteV2Location?: boolean
service: string
servicePort?: number
            }
export type TDataV2ProxyV2ServiceNamespacePathDelete = {
                namespace: string
path: string
service: string
            }
export type TDataV2ProxyV2ServiceNamespacePathDelete1 = {
                namespace: string
path: string
service: string
            }
export type TDataV2ProxyV2ServiceNamespacePathDelete2 = {
                namespace: string
path: string
service: string
            }
export type TDataV2ProxyV2ServiceNamespacePathDelete3 = {
                namespace: string
path: string
service: string
            }
export type TDataV2ProxyV2ServiceNamespacePathDelete4 = {
                namespace: string
path: string
service: string
            }
export type TDataV2ProxyV2ServiceNamespacePathDelete5 = {
                namespace: string
path: string
service: string
            }
export type TDataApiV1GcpFilestoreDelete = {
                instanceId: string
            }
export type TDataApiV1GcpFilestoreInstanceIdExpandPost = {
                instanceId: string
            }
export type TDataApiV1GcpComputeDisksDiskNameGet = {
                diskName: string
            }
export type TDataApiV1GcpComputeDisksDiskNameDelete = {
                diskName: string
            }
export type TDataApiV1GcpComputeDisksDiskNameSnapshotPost = {
                diskName: string
            }
export type TDataApiV1GcpComputeDisksDiskNameResizePost = {
                diskName: string
            }
export type TDataApiV1GcpComputeInstancesInstanceNameGet = {
                instanceName: string
            }
export type TDataApiV1GcpComputeInstancesInstanceNameDelete = {
                instanceName: string
            }
export type TDataApiV1GcpComputeInstancesInstanceNameStartPost = {
                instanceName: string
            }
export type TDataApiV1GcpComputeInstancesInstanceNameStopPost = {
                instanceName: string
            }
export type TDataApiV1GcpComputeInstancesInstanceNamePurgePasswordPost = {
                instanceName: string
            }
export type TDataApiV1StorageBucketsBucketNameGet = {
                bucketName: string
            }
export type TDataApiV1StorageBucketsBucketNamePost = {
                bucketName: string
            }
export type TDataApiV1StorageBucketsBucketNameDelete = {
                bucketName: string
            }
export type TDataApiV1StorageBucketsBucketNameObjectsGet = {
                bucketName: string
            }
export type TDataApiV1StorageBucketsBucketNameObjectsDelete = {
                bucketName: string
            }
export type TDataApiV1StorageBucketsBucketNameUploadPost = {
                bucketName: string
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
export type TDataApiSettingsDockerConfigPatch = {
                id: number
requestBody: Record<string, unknown>
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
export type TDataApiDockerPackagesGet = {
                id?: string | null
summary?: boolean
            }
export type TDataApiDockerPackagesPost = {
                requestBody: RunImage
            }
export type TDataApiDockerRegistryGet = {
                blob?: boolean | null
imageName?: string | null
mode?: string | null
namespace?: string | null
registryId?: number | null
serviceName?: string | null
servicePort?: number | null
sha256Digest?: string | null
tag?: string | null
            }
export type TDataApiDockerRegistryPost = {
                requestBody: CreateRegistryRequest
            }
export type TDataApiDockerRegistryPut = {
                requestBody: UpdateRegistryRequest
            }
export type TDataApiDockerRegistryDelete = {
                requestBody: DeleteRegistryRequest
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
 * Optional registry ID
 */
registryId?: number | null
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
export type TDataApiKubernertesRbacPost = {
                requestBody: CreateAccessBody
            }
export type TDataApiKubernertesRbacIdGet = {
                id: number
            }
export type TDataApiKubernertesRbacIdPut = {
                id: number
requestBody: rbac___id___UpdateAccessBody
            }
export type TDataApiKubernertesRbacIdDelete = {
                action?: string
id: number
            }
export type TDataApiKubernertesClusterMetricsNamespaceNamespaceGet = {
                namespace: string
            }
export type TDataApiKubernertesClusterNamespaceGet = {
                labelSelector?: string | null
            }
export type TDataApiKubernertesClusterNamespaceDelete = {
                name?: string | null
            }
export type TDataApiKubernertesMethodsApplyPost = {
                requestBody: ApplyBody
            }
export type TDataApiKubernertesMethodsDeletePost = {
                requestBody: ApplyBody
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
namespace?: string | null
            }
export type TDataApiKubernertesSecretsGet = {
                namespace?: string | null
secretName?: string | null
            }
export type TDataApiKubernertesResourcesGet = {
                namespace?: string | null
resources?: string | null
scope?: ResourceScope
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
                apiVersion?: string | null
modifytype?: string | null
name?: string | null
namespace?: string | null
type: string
            }
export type TDataApiKubernertesResourcesTypeDelete = {
                apiVersion?: string | null
name?: string | null
namespace?: string | null
type: string
            }
export type TDataApiKubernertesNamespacesNamespaceGet = {
                namespace: string
            }
export type TDataApiKubernertesPodsGet = {
                namespace?: string | null
podName?: string | null
            }
export type TDataApiKubernertesServiceGet = {
                namespace?: string | null
serviceName?: string | null
            }
export type TDataApiKubernertesDeploymentsGet = {
                deploymentName?: string | null
namespace?: string | null
resourceType?: string | null
            }
export type TDataApiBastionKeysPost = {
                requestBody: KeyCreate
            }
export type TDataApiBastionKeysKeyIdRevokePost = {
                keyId: number
requestBody: keys___keyId___RevokeRequest
            }
export type TDataApiBastionKeysKeyIdDeployPost = {
                keyId: number
requestBody: keys___keyId___DeployRequest
            }
export type TDataApiBastionKeysKeyIdDeployRetryPost = {
                keyId: number
requestBody: keys___keyId___RetryRequest
            }
export type TDataApiBastionKeysKeyIdDeploymentsGet = {
                keyId: number
            }
export type TDataApiBastionKeysInstallLocalPost = {
                requestBody: InstallLocalRequest
            }
export type TDataApiBastionSystemsPost = {
                requestBody: SystemCreate
            }
export type TDataApiBastionSystemsSystemIdDelete = {
                systemId: number
            }
export type TDataApiBastionSystemsSystemIdPatch = {
                systemId: number
            }
export type TDataApiBastionSystemsSystemIdRdpFileGet = {
                systemId: number
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
                branchName?: string | null
repoName: string
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
namespace?: string | null
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
export type TDataApiIntegrationKubernetesReleaseControlGet = {
                namespace?: string
            }
export type TDataApiIntegrationKubernetesServiceAccountGet = {
                namespace: string
            }
export type TDataApiIntegrationKubernetesImportYamlPost = {
                requestBody: YAMLImportRequest
            }
export type TDataApiIntegrationCredentialsPost = {
                requestBody: CreateCredentialRequest
            }
export type TDataApiIntegrationCredentialsPut = {
                id: number
requestBody?: UpdateCredentialRequest | null
            }
export type TDataApiIntegrationCredentialsDelete = {
                id: number
            }
export type TDataApiLibraryTemplateDelete = {
                name: string
            }
export type TDataApiLibraryTemplateFilesGet = {
                name?: string
            }
export type TDataApiLibraryValuesGet = {
                template?: string
            }
export type TDataApiLibraryValuesDelete = {
                envName?: string
template?: string
            }
export type TDataApiLibraryValuesContentGet = {
                envName: string
template: string
            }
export type TDataApiLibraryUsageGet = {
                envName?: string | null
template: string
            }
export type TDataApiLibraryHistoryGet = {
                chartName?: string | null
commitHash?: string | null
envName?: string | null
            }
export type TDataApiSystemOnboardingPost = {
                requestBody: OnboardingCompleteRequest
            }
export type TDataApiQueuePost = {
                requestBody: RunQueue
            }
export type TDataApiQueueDelete = {
                requestBody: StopQueue
            }
export type TDataApiOrchestrationK8sLoadImagePost = {
                requestBody: LoadImageRequest
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
export type TDataComputeInstanceNameGet = {
                instanceName: string
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
	 * Proxy requests to Kubernetes services (Prometheus/Grafana/Registry).
 * Uses intelligent port discovery: if port is 80 (default), it looks up the
 * actual service port in the Addon Registry.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static clusterProxyClusterProxyServiceNamespacePathDelete(data: TDataClusterProxyClusterProxyServiceNamespacePathDelete): CancelablePromise<unknown> {
		const {
namespace,
path,
rewriteV2Location = true,
service,
servicePort = 80,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/cluster/proxy/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			query: {
				service_port: servicePort, rewrite_v2_location: rewriteV2Location
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Cluster Proxy
	 * Proxy requests to Kubernetes services (Prometheus/Grafana/Registry).
 * Uses intelligent port discovery: if port is 80 (default), it looks up the
 * actual service port in the Addon Registry.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static clusterProxyClusterProxyServiceNamespacePathDelete1(data: TDataClusterProxyClusterProxyServiceNamespacePathDelete1): CancelablePromise<unknown> {
		const {
namespace,
path,
rewriteV2Location = true,
service,
servicePort = 80,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/cluster/proxy/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			query: {
				service_port: servicePort, rewrite_v2_location: rewriteV2Location
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Cluster Proxy
	 * Proxy requests to Kubernetes services (Prometheus/Grafana/Registry).
 * Uses intelligent port discovery: if port is 80 (default), it looks up the
 * actual service port in the Addon Registry.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static clusterProxyClusterProxyServiceNamespacePathDelete2(data: TDataClusterProxyClusterProxyServiceNamespacePathDelete2): CancelablePromise<unknown> {
		const {
namespace,
path,
rewriteV2Location = true,
service,
servicePort = 80,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/cluster/proxy/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			query: {
				service_port: servicePort, rewrite_v2_location: rewriteV2Location
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Cluster Proxy
	 * Proxy requests to Kubernetes services (Prometheus/Grafana/Registry).
 * Uses intelligent port discovery: if port is 80 (default), it looks up the
 * actual service port in the Addon Registry.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static clusterProxyClusterProxyServiceNamespacePathDelete3(data: TDataClusterProxyClusterProxyServiceNamespacePathDelete3): CancelablePromise<unknown> {
		const {
namespace,
path,
rewriteV2Location = true,
service,
servicePort = 80,
} = data;
		return __request(OpenAPI, {
			method: 'PATCH',
			url: '/cluster/proxy/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			query: {
				service_port: servicePort, rewrite_v2_location: rewriteV2Location
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Cluster Proxy
	 * Proxy requests to Kubernetes services (Prometheus/Grafana/Registry).
 * Uses intelligent port discovery: if port is 80 (default), it looks up the
 * actual service port in the Addon Registry.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static clusterProxyClusterProxyServiceNamespacePathDelete4(data: TDataClusterProxyClusterProxyServiceNamespacePathDelete4): CancelablePromise<unknown> {
		const {
namespace,
path,
rewriteV2Location = true,
service,
servicePort = 80,
} = data;
		return __request(OpenAPI, {
			method: 'HEAD',
			url: '/cluster/proxy/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			query: {
				service_port: servicePort, rewrite_v2_location: rewriteV2Location
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Cluster Proxy
	 * Proxy requests to Kubernetes services (Prometheus/Grafana/Registry).
 * Uses intelligent port discovery: if port is 80 (default), it looks up the
 * actual service port in the Addon Registry.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static clusterProxyClusterProxyServiceNamespacePathDelete5(data: TDataClusterProxyClusterProxyServiceNamespacePathDelete5): CancelablePromise<unknown> {
		const {
namespace,
path,
rewriteV2Location = true,
service,
servicePort = 80,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/cluster/proxy/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			query: {
				service_port: servicePort, rewrite_v2_location: rewriteV2Location
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * V2 Proxy
	 * Specialized proxy for Docker Registry V2 API.
 * Always uses port 5000 and the /v2 prefix.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static v2ProxyV2ServiceNamespacePathDelete(data: TDataV2ProxyV2ServiceNamespacePathDelete): CancelablePromise<unknown> {
		const {
namespace,
path,
service,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/v2/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * V2 Proxy
	 * Specialized proxy for Docker Registry V2 API.
 * Always uses port 5000 and the /v2 prefix.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static v2ProxyV2ServiceNamespacePathDelete1(data: TDataV2ProxyV2ServiceNamespacePathDelete1): CancelablePromise<unknown> {
		const {
namespace,
path,
service,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/v2/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * V2 Proxy
	 * Specialized proxy for Docker Registry V2 API.
 * Always uses port 5000 and the /v2 prefix.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static v2ProxyV2ServiceNamespacePathDelete2(data: TDataV2ProxyV2ServiceNamespacePathDelete2): CancelablePromise<unknown> {
		const {
namespace,
path,
service,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/v2/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * V2 Proxy
	 * Specialized proxy for Docker Registry V2 API.
 * Always uses port 5000 and the /v2 prefix.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static v2ProxyV2ServiceNamespacePathDelete3(data: TDataV2ProxyV2ServiceNamespacePathDelete3): CancelablePromise<unknown> {
		const {
namespace,
path,
service,
} = data;
		return __request(OpenAPI, {
			method: 'PATCH',
			url: '/v2/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * V2 Proxy
	 * Specialized proxy for Docker Registry V2 API.
 * Always uses port 5000 and the /v2 prefix.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static v2ProxyV2ServiceNamespacePathDelete4(data: TDataV2ProxyV2ServiceNamespacePathDelete4): CancelablePromise<unknown> {
		const {
namespace,
path,
service,
} = data;
		return __request(OpenAPI, {
			method: 'HEAD',
			url: '/v2/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * V2 Proxy
	 * Specialized proxy for Docker Registry V2 API.
 * Always uses port 5000 and the /v2 prefix.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static v2ProxyV2ServiceNamespacePathDelete5(data: TDataV2ProxyV2ServiceNamespacePathDelete5): CancelablePromise<unknown> {
		const {
namespace,
path,
service,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/v2/{service}/{namespace}/{path}',
			path: {
				service, namespace, path
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * V2 Root
	 * Handle Docker's initial 'GET /v2/' check.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static v2RootV2Get(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/v2/',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1AuthLogoutPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/auth/logout',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1AuthMeGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/auth/me',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1AuthCallbackGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/auth/callback',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1AuthLoginGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/auth/login',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpProvisionPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/gcp/provision',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpProjectsGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/gcp/projects',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpFilestoreGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/gcp/filestore',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpFilestoreDelete(data: TDataApiV1GcpFilestoreDelete): CancelablePromise<unknown> {
		const {
instanceId,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/gcp/filestore',
			query: {
				instance_id: instanceId
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
	public static apiV1GcpFilestoreInstanceIdExpandPost(data: TDataApiV1GcpFilestoreInstanceIdExpandPost): CancelablePromise<unknown> {
		const {
instanceId,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/gcp/filestore/{instance_id}/expand',
			path: {
				instance_id: instanceId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Dynamically fetch all GCP metadata options via SDK discovery services.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpMetaGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/gcp/meta',
		});
	}

	/**
	 * Fetch live GCP image catalog with official API resolution.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeImagesGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/gcp/compute/images',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeDiskTypesGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/gcp/compute/disk-types',
		});
	}

	/**
	 * List all persistent disks in the selected project.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeDisksGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/gcp/compute/disks',
		});
	}

	/**
	 * Create a new persistent disk.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeDisksPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/gcp/compute/disks',
		});
	}

	/**
	 * Get details for a specific persistent disk.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeDisksDiskNameGet(data: TDataApiV1GcpComputeDisksDiskNameGet): CancelablePromise<unknown> {
		const {
diskName,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/gcp/compute/disks/{disk_name}',
			path: {
				disk_name: diskName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete a persistent disk.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeDisksDiskNameDelete(data: TDataApiV1GcpComputeDisksDiskNameDelete): CancelablePromise<unknown> {
		const {
diskName,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/gcp/compute/disks/{disk_name}',
			path: {
				disk_name: diskName
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
	public static apiV1GcpComputeDisksDiskNameSnapshotPost(data: TDataApiV1GcpComputeDisksDiskNameSnapshotPost): CancelablePromise<unknown> {
		const {
diskName,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/gcp/compute/disks/{disk_name}/snapshot',
			path: {
				disk_name: diskName
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
	public static apiV1GcpComputeDisksDiskNameResizePost(data: TDataApiV1GcpComputeDisksDiskNameResizePost): CancelablePromise<unknown> {
		const {
diskName,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/gcp/compute/disks/{disk_name}/resize',
			path: {
				disk_name: diskName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * List all instances across all zones in the selected project.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeInstancesGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/gcp/compute/instances',
		});
	}

	/**
	 * Provision a new VM instance using SSH key authentication.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeInstancesPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/gcp/compute/instances',
		});
	}

	/**
	 * Fetch deep details for a specific VM instance.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeInstancesInstanceNameGet(data: TDataApiV1GcpComputeInstancesInstanceNameGet): CancelablePromise<unknown> {
		const {
instanceName,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/gcp/compute/instances/{instance_name}',
			path: {
				instance_name: instanceName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Trigger asynchronous deletion of a VM instance using background tasks.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeInstancesInstanceNameDelete(data: TDataApiV1GcpComputeInstancesInstanceNameDelete): CancelablePromise<unknown> {
		const {
instanceName,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/gcp/compute/instances/{instance_name}',
			path: {
				instance_name: instanceName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Start a stopped or terminated VM instance.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeInstancesInstanceNameStartPost(data: TDataApiV1GcpComputeInstancesInstanceNameStartPost): CancelablePromise<unknown> {
		const {
instanceName,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/gcp/compute/instances/{instance_name}/start',
			path: {
				instance_name: instanceName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Stop a running VM instance (graceful shutdown).
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeInstancesInstanceNameStopPost(data: TDataApiV1GcpComputeInstancesInstanceNameStopPost): CancelablePromise<unknown> {
		const {
instanceName,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/gcp/compute/instances/{instance_name}/stop',
			path: {
				instance_name: instanceName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Purge the temporary admin onboarding password for a compute instance.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1GcpComputeInstancesInstanceNamePurgePasswordPost(data: TDataApiV1GcpComputeInstancesInstanceNamePurgePasswordPost): CancelablePromise<unknown> {
		const {
instanceName,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/gcp/compute/instances/{instance_name}/purge-password',
			path: {
				instance_name: instanceName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * List all GCS buckets.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageBucketsGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/storage/buckets',
		});
	}

	/**
	 * Create a new GCS bucket.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageBucketsPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/storage/buckets',
		});
	}

	/**
	 * List all objects inside a bucket with optional prefix (folder) filtering.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageBucketsBucketNameGet(data: TDataApiV1StorageBucketsBucketNameGet): CancelablePromise<unknown> {
		const {
bucketName,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/storage/buckets/{bucket_name}',
			path: {
				bucket_name: bucketName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create a virtual folder (zero-byte placeholder blob ending with '/').
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageBucketsBucketNamePost(data: TDataApiV1StorageBucketsBucketNamePost): CancelablePromise<unknown> {
		const {
bucketName,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/storage/buckets/{bucket_name}',
			path: {
				bucket_name: bucketName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete a bucket and all its contents.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageBucketsBucketNameDelete(data: TDataApiV1StorageBucketsBucketNameDelete): CancelablePromise<unknown> {
		const {
bucketName,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/storage/buckets/{bucket_name}',
			path: {
				bucket_name: bucketName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Generate a signed download URL for an object (expires in 15 min).
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageBucketsBucketNameObjectsGet(data: TDataApiV1StorageBucketsBucketNameObjectsGet): CancelablePromise<unknown> {
		const {
bucketName,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/storage/buckets/{bucket_name}/objects',
			path: {
				bucket_name: bucketName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete a specific object from a bucket.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageBucketsBucketNameObjectsDelete(data: TDataApiV1StorageBucketsBucketNameObjectsDelete): CancelablePromise<unknown> {
		const {
bucketName,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/storage/buckets/{bucket_name}/objects',
			path: {
				bucket_name: bucketName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Upload a file to a specific bucket with an optional folder prefix.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageBucketsBucketNameUploadPost(data: TDataApiV1StorageBucketsBucketNameUploadPost): CancelablePromise<unknown> {
		const {
bucketName,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/storage/buckets/{bucket_name}/upload',
			path: {
				bucket_name: bucketName
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
	public static apiV1StorageExplorerGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/storage/explorer',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageExplorerPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/storage/explorer',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageExplorerObjectsGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/storage/explorer/objects',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageExplorerObjectsPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/storage/explorer/objects',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageExplorerObjectsDelete(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/storage/explorer/objects',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1StorageExplorerFoldersPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/storage/explorer/folders',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1PricingEstimateGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/pricing/estimate',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiV1PricingDebugGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/pricing/debug',
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
	public static apiSettingsDockerConfigPatch(data: TDataApiSettingsDockerConfigPatch): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PATCH',
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
	public static apiDockerPackagesGet(data: TDataApiDockerPackagesGet = {}): CancelablePromise<unknown> {
		const {
id,
summary = false,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/packages',
			query: {
				id, summary
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
	 * Returns image sizes for all tagged images.
 * Used for lazy-loading in the UI to keep the initial list fetch fast.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiDockerPackagesStatsGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/packages/stats',
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
mode,
namespace,
registryId,
serviceName,
servicePort,
sha256Digest,
tag,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/registry',
			query: {
				namespace, service_name: serviceName, service_port: servicePort, image_name: imageName, tag, blob, sha256_digest: sha256Digest, registry_id: registryId, mode
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Handle Registry Creation and Image Push
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiDockerRegistryPost(data: TDataApiDockerRegistryPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/docker/registry',
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
	public static apiDockerRegistryPut(data: TDataApiDockerRegistryPut): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/docker/registry',
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
	public static apiDockerRegistryDelete(data: TDataApiDockerRegistryDelete): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/docker/registry',
			body: requestBody,
			mediaType: 'application/json',
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
registryId,
repo,
sha256,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/docker/registry/examine',
			query: {
				repo, sha256, action, file_path: filePath, format, registryId
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
	public static apiKubernertesRbacGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/rbac',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesRbacPost(data: TDataApiKubernertesRbacPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/kubernertes/rbac',
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
	public static apiKubernertesRbacIdGet(data: TDataApiKubernertesRbacIdGet): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/rbac/{id}',
			path: {
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
	public static apiKubernertesRbacIdPut(data: TDataApiKubernertesRbacIdPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/kubernertes/rbac/{id}',
			path: {
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
	public static apiKubernertesRbacIdDelete(data: TDataApiKubernertesRbacIdDelete): CancelablePromise<unknown> {
		const {
action = 'revoke',
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/kubernertes/rbac/{id}',
			path: {
				id
			},
			query: {
				action
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
	public static apiKubernertesClusterMetricsNamespaceGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/cluster/metrics/namespace',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesClusterMetricsNamespaceNamespaceGet(data: TDataApiKubernertesClusterMetricsNamespaceNamespaceGet): CancelablePromise<unknown> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/cluster/metrics/namespace/{namespace}',
			path: {
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
	public static apiKubernertesClusterNamespacePost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/kubernertes/cluster/namespace',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesClusterNamespaceDelete(data: TDataApiKubernertesClusterNamespaceDelete = {}): CancelablePromise<unknown> {
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
	public static apiKubernertesMethodsGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/methods',
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
	public static apiKubernertesContextGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/context',
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
	public static apiKubernertesIngressGet(data: TDataApiKubernertesIngressGet = {}): CancelablePromise<unknown> {
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
	public static apiKubernertesSecretsGet(data: TDataApiKubernertesSecretsGet = {}): CancelablePromise<unknown> {
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
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesResourcesGet(data: TDataApiKubernertesResourcesGet = {}): CancelablePromise<unknown> {
		const {
namespace,
resources,
scope = 'all',
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
	 * Generic GET for any Kubernetes resource.
 * Usage: /api/kubernertes/resources/[type]?namespace=...&api_version=...
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
	 * Generic PUT for editing resources.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesResourcesTypePut(data: TDataApiKubernertesResourcesTypePut): CancelablePromise<unknown> {
		const {
apiVersion,
modifytype,
name,
namespace,
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
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Generic DELETE for any Kubernetes resource.
 * Usage: /api/kubernertes/resources/[type]?apiVersion=...&name=...&namespace=...
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
	public static apiKubernertesUserGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/user',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesNamespacesGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/namespaces',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesNamespacesNamespaceGet(data: TDataApiKubernertesNamespacesNamespaceGet): CancelablePromise<unknown> {
		const {
namespace,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/namespaces/{namespace}',
			path: {
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
	public static apiKubernertesPodsGet(data: TDataApiKubernertesPodsGet = {}): CancelablePromise<unknown> {
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
	 * List all available Kubeconfigs.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesConfigsGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/configs',
		});
	}

	/**
	 * Handle adding, activating, or switching contexts in a Kubeconfig.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesConfigsPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/kubernertes/configs',
		});
	}

	/**
	 * Delete a Kubeconfig file from the database.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesConfigsDelete(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/kubernertes/configs',
		});
	}

	/**
	 * Get detailed information for all services or a specific service in a namespace, with bubbled-up events.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesServiceGet(data: TDataApiKubernertesServiceGet = {}): CancelablePromise<unknown> {
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
	public static apiKubernertesLimitRangeGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/limit-range',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesResourceQuotaGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/resource-quota',
		});
	}

	/**
	 * FastAPI endpoint to get comprehensive namespace information with optional deployment filtering
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesDeploymentsGet(data: TDataApiKubernertesDeploymentsGet = {}): CancelablePromise<unknown> {
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
	public static apiKubernertesFlowV1Get(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/flow/v1',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiKubernertesFlowV2Get(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/kubernertes/flow/v2',
		});
	}

	/**
	 * List all audit log sessions ordered by most recent first, or return full keystroke data for a specific id
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionAuditGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/bastion/audit',
		});
	}

	/**
	 * List all SSH keys
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionKeysGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/bastion/keys',
		});
	}

	/**
	 * Add or generate a new SSH key
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionKeysPost(data: TDataApiBastionKeysPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/bastion/keys',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Universally revoke an SSH key from all reachable servers and delete from database.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionKeysDelete(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/bastion/keys',
		});
	}

	/**
	 * Rotate the core Bastion Platform Service Key and auto-reprovision target systems
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionKeysRotatePost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/bastion/keys/rotate',
		});
	}

	/**
	 * Revoke system access for an SSH key using background tasks
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionKeysKeyIdRevokePost(data: TDataApiBastionKeysKeyIdRevokePost): CancelablePromise<unknown> {
		const {
keyId,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/bastion/keys/{keyId}/revoke',
			path: {
				keyId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Deploy an SSH key with granular options using background tasks
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionKeysKeyIdDeployPost(data: TDataApiBastionKeysKeyIdDeployPost): CancelablePromise<unknown> {
		const {
keyId,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/bastion/keys/{keyId}/deploy',
			path: {
				keyId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Retry a failed deployment by resetting its status and re-running the background task
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionKeysKeyIdDeployRetryPost(data: TDataApiBastionKeysKeyIdDeployRetryPost): CancelablePromise<unknown> {
		const {
keyId,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/bastion/keys/{keyId}/deploy/retry',
			path: {
				keyId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * List all system deployments for a specific SSH key
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionKeysKeyIdDeploymentsGet(data: TDataApiBastionKeysKeyIdDeploymentsGet): CancelablePromise<unknown> {
		const {
keyId,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/bastion/keys/{keyId}/deployments',
			path: {
				keyId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Write a private key to the host machine's ~/.ssh directory so the user can
 * SSH from their own terminal without extra steps.
 * Detects OS automatically and sets correct permissions.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionKeysInstallLocalPost(data: TDataApiBastionKeysInstallLocalPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/bastion/keys/install-local',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * List all systems — never return passwords or private keys
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionSystemsGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/bastion/systems',
		});
	}

	/**
	 * Register a new system. Password or Private Key is Fernet-encrypted before storage.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionSystemsPost(data: TDataApiBastionSystemsPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/bastion/systems',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Soft-delete a registered system (mark as deleted, preserve audit logs)
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionSystemsSystemIdDelete(data: TDataApiBastionSystemsSystemIdDelete): CancelablePromise<unknown> {
		const {
systemId,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/bastion/systems/{systemId}',
			path: {
				systemId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update system status (active/inactive)
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionSystemsSystemIdPatch(data: TDataApiBastionSystemsSystemIdPatch): CancelablePromise<unknown> {
		const {
systemId,
} = data;
		return __request(OpenAPI, {
			method: 'PATCH',
			url: '/api/bastion/systems/{systemId}',
			path: {
				systemId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Generates a secure, memory-isolated RDP initialization manifest stream.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiBastionSystemsSystemIdRdpFileGet(data: TDataApiBastionSystemsSystemIdRdpFileGet): CancelablePromise<unknown> {
		const {
systemId,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/bastion/systems/{systemId}/rdp-file',
			path: {
				systemId
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
	 * Trigger a manual poll for all currently enabled repositories.
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
	 * Update polling configuration. Handles both global interval and per-repo toggling.
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
	 * Proxy delete and sync pollers.
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
				name, namespace
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
	 * List active releases (canary/blue-green).
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationKubernetesReleaseControlGet(data: TDataApiIntegrationKubernetesReleaseControlGet = {}): CancelablePromise<unknown> {
		const {
namespace = 'default',
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/release/control',
			query: {
				namespace
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Handle release actions: update weights, promote, or rollback.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationKubernetesReleaseControlPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/kubernetes/release/control',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationKubernetesDeploymentStrategyGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/kubernetes/deployment_strategy',
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
	 * @returns CredentialListItem Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationCredentialsGet(): CancelablePromise<Array<CredentialListItem>> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/integration/credentials',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiIntegrationCredentialsPost(data: TDataApiIntegrationCredentialsPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/integration/credentials',
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
	public static apiIntegrationCredentialsPut(data: TDataApiIntegrationCredentialsPut): CancelablePromise<unknown> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/integration/credentials',
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
	public static apiIntegrationCredentialsDelete(data: TDataApiIntegrationCredentialsDelete): CancelablePromise<unknown> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/integration/credentials',
			query: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * List all addons, OR fetch default values for a chart.
 * 
 * Query params for chart defaults:
 * ?action=fetch_values&repo_name=...&repo_url=...&chart_name=...
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiAddonsGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/addons',
		});
	}

	/**
	 * Handle creation, install, or uninstall based on action
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiAddonsPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/addons',
		});
	}

	/**
	 * Search/Index endpoint for the Library.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibraryGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/library',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibrarySettingsGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/library/settings',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibrarySettingsPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/library/settings',
		});
	}

	/**
	 * Manually trigger a push to the remote repository.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibrarySettingsPushPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/library/settings/push',
		});
	}

	/**
	 * Get the current conflict status of the library repository.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibrarySettingsSyncGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/library/settings/sync',
		});
	}

	/**
	 * Resolve a conflict in a specific file or continue the sync process.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibrarySettingsSyncPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/library/settings/sync',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibraryTemplatePost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/library/template',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibraryTemplateDelete(data: TDataApiLibraryTemplateDelete): CancelablePromise<unknown> {
		const {
name,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/library/template',
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
	public static apiLibraryTemplateFilesGet(data: TDataApiLibraryTemplateFilesGet = {}): CancelablePromise<unknown> {
		const {
name,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/library/template/files',
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
	public static apiLibraryTemplateFilesPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/library/template/files',
		});
	}

	/**
	 * List all environment configurations for a given template.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibraryValuesGet(data: TDataApiLibraryValuesGet = {}): CancelablePromise<unknown> {
		const {
template,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/library/values',
			query: {
				template
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create or update an environment configuration for a template.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibraryValuesPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/library/values',
		});
	}

	/**
	 * Delete an environment configuration.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibraryValuesDelete(data: TDataApiLibraryValuesDelete = {}): CancelablePromise<unknown> {
		const {
envName,
template,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/library/values',
			query: {
				template, env_name: envName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Return raw YAML content of a specific environment configuration.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibraryValuesContentGet(data: TDataApiLibraryValuesContentGet): CancelablePromise<unknown> {
		const {
envName,
template,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/library/values/content',
			query: {
				template, env_name: envName
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
	public static apiLibraryUsageGet(data: TDataApiLibraryUsageGet): CancelablePromise<unknown> {
		const {
envName,
template,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/library/usage',
			query: {
				template, env_name: envName
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get history or diff for charts and environments.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibraryHistoryGet(data: TDataApiLibraryHistoryGet = {}): CancelablePromise<unknown> {
		const {
chartName,
commitHash,
envName,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/library/history',
			query: {
				chart_name: chartName, env_name: envName, commit_hash: commitHash
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Revert a chart or environment to a specific commit.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiLibraryHistoryRevertPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/library/history/revert',
		});
	}

	/**
	 * Aggregated Dashboard API.
 * Fetches K8s, Docker, Registry, and CI/CD data in parallel with a 5s TTL cache.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiDashboardGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/dashboard',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSystemInstallGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/system/install',
		});
	}

	/**
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSystemInstallPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/system/install',
		});
	}

	/**
	 * Check if onboarding is required for the current user's tenant.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSystemOnboardingGet(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/system/onboarding',
		});
	}

	/**
	 * Mark onboarding as completed for the current user's tenant.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiSystemOnboardingPost(data: TDataApiSystemOnboardingPost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/system/onboarding',
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
	 * Load a docker image into the current Kind or Minikube cluster.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static apiOrchestrationK8sLoadImagePost(data: TDataApiOrchestrationK8sLoadImagePost): CancelablePromise<unknown> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/orchestration/k8s/load_image',
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
component = 'gateway-api',
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
component = 'gateway-api',
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
component = 'gateway-api',
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
component = 'gateway-api',
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
	public static settingsDockerRegistryGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/docker/registry',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsDockerRegistryImageGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/docker/registry/{image}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsDockerRegistryImageTagGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/docker/registry/{image}/{tag}',
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
	public static settingsCiCdLibraryTemplateNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/library/{templateName}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdReleaseControlGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/release_control',
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
	public static settingsCiCdSourceControlRepoIdGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/source_control/{repo_id}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsCiCdSourceControlRepoIdBranchNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/ci_cd/source_control/{repo_id}/{branch_name}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsChartsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/charts',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpStorageGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp/storage',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpStorageBucketsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp/storage/buckets',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpStorageBucketsIdGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp/storage/buckets/{id}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpStorageFilestoresGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp/storage/filestores',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpStorageFilestoresIdGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp/storage/filestores/{id}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpStorageDisksGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp/storage/disks',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpStorageDisksIdGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp/storage/disks/{id}',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpComputeGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp/compute',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpComputeInstancesGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp/compute/instances',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static settingsGcpComputeInstancesInstanceNameGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/gcp/compute/instances/{instance_name}',
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
	public static settingsKubernetesConfigsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/kubernetes/configs',
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
	public static settingsCredentialsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/settings/credentials',
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
	public static bastionGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/bastion',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static bastionAuditGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/bastion/audit',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static bastionKeysGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/bastion/keys',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static bastionSystemsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/bastion/systems',
		});
	}

	/**
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static bastionConsoleGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/bastion/console',
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
	public static addonsEssentialsGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/addons/essentials',
		});
	}

	/**
	 * Server-side props loader for the VM Details page.
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static computeInstanceNameGet(data: TDataComputeInstanceNameGet): CancelablePromise<string> {
		const {
instanceName,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/compute/{instance_name}',
			path: {
				instance_name: instanceName
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
	public static orchestrationKubernetesNamespaceFlowV2Get(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/orchestration/kubernetes/{namespace}/flowV2',
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
	public static loginGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/login',
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
	public static ceeDockerPackagesIdGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/cee/docker/packages/{id}',
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

	/**
	 * Explicitly accept the request object. 
 * KiwiJs view_func expects this to be passed down correctly.
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static onboardingGet(): CancelablePromise<string> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/onboarding',
		});
	}

	/**
	 * Livereload Notify
	 * Internal endpoint: DevChangeHandler POSTs here to trigger browser notifications.
	 * @returns unknown Successful Response
	 * @throws ApiError
	 */
	public static livereloadNotifyLiveReloadNotifyPost(): CancelablePromise<unknown> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/__live_reload_notify',
		});
	}

}