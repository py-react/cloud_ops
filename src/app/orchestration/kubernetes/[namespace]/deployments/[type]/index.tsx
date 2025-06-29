import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { NamespaceContext } from "@/components/kubernetes/contextProvider/NamespaceContext";
import { NamespaceSelector } from "@/components/kubernetes/NamespaceSelector";
import useKubernertesResources from "@/hooks/use-resource";
import ResourceForm from "@/components/resource-form/resource-form"

import { DefaultService } from "@/gingerJs_api_client";
import { toast } from "sonner";
import { RocketIcon, Box, Settings, Server, HardDrive, Network, Shield, Activity } from "lucide-react";
import RouteDescription from "@/components/route-description";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { DeploymentItem } from "@/components/kubernetes/quick-view-resources/DeploymentList";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { Wizard } from "@/components/wizard/wizard";
import yaml from "js-yaml"
import { ResourceFlow } from "@/components/kubernetes/DeploymentOverview";
import DeploymentDetails from "@/components/kubernetes/quick-view-resources/details/deployment";
import { useParams } from "react-router-dom";
import useNavigate from "@/libs/navigate";

// Define types for better type safety
interface DeploymentItem {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  strategy?: string;
  labels: string[];
  status: string;
  last_applied?: string;
  fullData: any;
  showEdit: boolean;
  showDelete: boolean;
  showViewDetails: boolean;
}

interface Condition {
  type: string;
  status: string;
  message?: string;
  lastUpdateTime?: string;
}

const columns = [
  { header: "Name", accessor: "name" },
  { header: "Namespace", accessor: "namespace" },
  { header: "Replicas", accessor: "replicas" },
  { header: "Ready", accessor: "readyReplicas" },
  { header: "Strategy", accessor: "strategy" },
  { header: "Labels", accessor: "labels" },
  { header: "Status", accessor: "status" },
];

// Section components
const OverviewSection = ({ deployment }: { deployment: any }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Metadata</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Name</label>
          <p className="text-sm">{deployment.metadata?.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Namespace</label>
          <p className="text-sm">{deployment.metadata?.namespace}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">UID</label>
          <p className="text-sm">{deployment.metadata?.uid}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Resource Version</label>
          <p className="text-sm">{deployment.metadata?.resourceVersion}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Creation Timestamp</label>
          <p className="text-sm">{new Date(deployment.metadata?.creationTimestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>

    {deployment.metadata?.labels && Object.keys(deployment.metadata.labels).length > 0 && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Labels</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(deployment.metadata.labels).map(([key, value]) => (
            <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {key}: {value}
            </span>
          ))}
        </div>
      </div>
    )}

    {deployment.metadata?.annotations && Object.keys(deployment.metadata.annotations).length > 0 && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Annotations</h3>
        <div className="space-y-2">
          {Object.entries(deployment.metadata.annotations).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">{key}</span>
              <span className="text-sm">{value as string}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const SpecificationSection = ({ deployment }: { deployment: any }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Replica Configuration</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Replicas</label>
          <p className="text-sm">{deployment.spec?.replicas}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Strategy Type</label>
          <p className="text-sm">{deployment.spec?.strategy?.type}</p>
        </div>
      </div>
    </div>

    {deployment.spec?.selector && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Selector</h3>
        <div className="space-y-2">
          {Object.entries(deployment.spec.selector.matchLabels || {}).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">{key}</span>
              <span className="text-sm">{value as string}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {deployment.spec?.strategy && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Update Strategy</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Type</label>
            <p className="text-sm">{deployment.spec.strategy.type}</p>
          </div>
          {deployment.spec.strategy.rollingUpdate && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600">Max Unavailable</label>
                <p className="text-sm">{deployment.spec.strategy.rollingUpdate.maxUnavailable}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Max Surge</label>
                <p className="text-sm">{deployment.spec.strategy.rollingUpdate.maxSurge}</p>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>
);

const ContainersSection = ({ deployment }: { deployment: any }) => (
  <div className="space-y-6">
    {deployment.spec?.template?.spec?.containers?.map((container: any, index: number) => (
      <div key={index} className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">{container.name}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Image</label>
            <p className="text-sm">{container.image}</p>
          </div>
          {container.command && (
            <div>
              <label className="text-sm font-medium text-gray-600">Command</label>
              <p className="text-sm">{container.command.join(' ')}</p>
            </div>
          )}
          {container.args && (
            <div>
              <label className="text-sm font-medium text-gray-600">Args</label>
              <p className="text-sm">{container.args.join(' ')}</p>
            </div>
          )}
          {container.ports && container.ports.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">Ports</label>
              <div className="space-y-1">
                {container.ports.map((port: any, portIndex: number) => (
                  <p key={portIndex} className="text-sm">
                    {port.containerPort}/{port.protocol || 'TCP'}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {container.env && container.env.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600">Environment Variables</label>
            <div className="space-y-1">
              {container.env.map((env: any, envIndex: number) => (
                <div key={envIndex} className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">{env.name}</span>
                  <span className="text-sm">{env.value || 'From ConfigMap/Secret'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {container.resources && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600">Resources</label>
            <div className="grid grid-cols-2 gap-4">
              {container.resources.requests && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Requests</label>
                  <p className="text-sm">
                    CPU: {container.resources.requests.cpu || 'N/A'}, 
                    Memory: {container.resources.requests.memory || 'N/A'}
                  </p>
                </div>
              )}
              {container.resources.limits && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Limits</label>
                  <p className="text-sm">
                    CPU: {container.resources.limits.cpu || 'N/A'}, 
                    Memory: {container.resources.limits.memory || 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
);

const VolumesSection = ({ deployment }: { deployment: any }) => (
  <div className="space-y-6">
    {deployment.spec?.template?.spec?.volumes && deployment.spec.template.spec.volumes.length > 0 ? (
      deployment.spec.template.spec.volumes.map((volume: any, index: number) => (
        <div key={index} className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">{volume.name}</h3>
          <div className="grid grid-cols-2 gap-4">
            {volume.configMap && (
              <div>
                <label className="text-sm font-medium text-gray-600">ConfigMap</label>
                <p className="text-sm">{volume.configMap.name}</p>
              </div>
            )}
            {volume.secret && (
              <div>
                <label className="text-sm font-medium text-gray-600">Secret</label>
                <p className="text-sm">{volume.secret.secretName}</p>
              </div>
            )}
            {volume.persistentVolumeClaim && (
              <div>
                <label className="text-sm font-medium text-gray-600">Persistent Volume Claim</label>
                <p className="text-sm">{volume.persistentVolumeClaim.claimName}</p>
              </div>
            )}
            {volume.emptyDir && (
              <div>
                <label className="text-sm font-medium text-gray-600">Empty Directory</label>
                <p className="text-sm">Temporary storage</p>
              </div>
            )}
          </div>
        </div>
      ))
    ) : (
      <p className="text-gray-500">No volumes configured</p>
    )}
  </div>
);

const NetworkingSection = ({ deployment }: { deployment: any }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Service Account</h3>
      <p className="text-sm">{deployment.spec?.template?.spec?.serviceAccountName || 'default'}</p>
    </div>

    {deployment.spec?.template?.spec?.dnsPolicy && (
      <div>
        <h3 className="text-lg font-semibold mb-4">DNS Policy</h3>
        <p className="text-sm">{deployment.spec.template.spec.dnsPolicy}</p>
      </div>
    )}

    {deployment.spec?.template?.spec?.affinity && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Affinity Rules</h3>
        <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(deployment.spec.template.spec.affinity, null, 2)}
        </pre>
      </div>
    )}

    {deployment.spec?.template?.spec?.tolerations && deployment.spec.template.spec.tolerations.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Tolerations</h3>
        <div className="space-y-2">
          {deployment.spec.template.spec.tolerations.map((toleration: any, index: number) => (
            <div key={index} className="text-sm">
              {toleration.key}={toleration.value}: {toleration.effect}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const SecuritySection = ({ deployment }: { deployment: any }) => (
  <div className="space-y-6">
    {deployment.spec?.template?.spec?.securityContext && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Pod Security Context</h3>
        <div className="grid grid-cols-2 gap-4">
          {deployment.spec.template.spec.securityContext.runAsUser && (
            <div>
              <label className="text-sm font-medium text-gray-600">Run As User</label>
              <p className="text-sm">{deployment.spec.template.spec.securityContext.runAsUser}</p>
            </div>
          )}
          {deployment.spec.template.spec.securityContext.runAsGroup && (
            <div>
              <label className="text-sm font-medium text-gray-600">Run As Group</label>
              <p className="text-sm">{deployment.spec.template.spec.securityContext.runAsGroup}</p>
            </div>
          )}
          {deployment.spec.template.spec.securityContext.fsGroup && (
            <div>
              <label className="text-sm font-medium text-gray-600">FS Group</label>
              <p className="text-sm">{deployment.spec.template.spec.securityContext.fsGroup}</p>
            </div>
          )}
        </div>
      </div>
    )}

    {deployment.spec?.template?.spec?.containers?.some((container: any) => container.securityContext) && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Container Security Contexts</h3>
        {deployment.spec.template.spec.containers.map((container: any, index: number) => (
          container.securityContext && (
            <div key={index} className="border rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">{container.name}</h4>
              <div className="grid grid-cols-2 gap-4">
                {container.securityContext.runAsUser && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Run As User</label>
                    <p className="text-sm">{container.securityContext.runAsUser}</p>
                  </div>
                )}
                {container.securityContext.runAsNonRoot && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Run As Non Root</label>
                    <p className="text-sm">{container.securityContext.runAsNonRoot ? 'Yes' : 'No'}</p>
                  </div>
                )}
                {container.securityContext.allowPrivilegeEscalation && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Allow Privilege Escalation</label>
                    <p className="text-sm">{container.securityContext.allowPrivilegeEscalation ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            </div>
          )
        ))}
      </div>
    )}
  </div>
);

const StatusSection = ({ deployment }: { deployment: any }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Replica Status</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Desired Replicas</label>
          <p className="text-sm">{deployment.status?.replicas || 0}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Ready Replicas</label>
          <p className="text-sm">{deployment.status?.readyReplicas || 0}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Available Replicas</label>
          <p className="text-sm">{deployment.status?.availableReplicas || 0}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Updated Replicas</label>
          <p className="text-sm">{deployment.status?.updatedReplicas || 0}</p>
        </div>
      </div>
    </div>

    {deployment.status?.conditions && deployment.status.conditions.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold mb-4">Conditions</h3>
        <div className="space-y-2">
          {deployment.status.conditions.map((condition: any, index: number) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{condition.type}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  condition.status === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {condition.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{condition.message}</p>
              {condition.lastUpdateTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Last Update: {new Date(condition.lastUpdateTime).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export  function Page(){
  
  return <DeploymentDetails namespace="default" deploymentName="testing" />
}

export default function DeploymentsPage() {
  const navigate = useNavigate()
  const {namespace,type} = useParams()
  const { selectedNamespace } = useContext(NamespaceContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentToEdit, setCurrentToEdit] = useState<any>(null);
  const [showDetailsWizard, setShowDetailsWizard] = useState(false);
  const [currentDeployment, setCurrentDeployment] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState('overview');
  
  const resourceType = type || "deployments";
  
  const {
    resource: deployments,
    error,
    refetch,
  } = useKubernertesResources({
    nameSpace: selectedNamespace,
    type: resourceType,
  });

  // Transform API data to match DeploymentItem type
  const transformedDeployments =
    deployments?.map((dep: any) => {
      // Conditionally set replicas and readyReplicas based on resource type
      let replicas = 0;
      let readyReplicas = 0;
      let strategy = "";

      if (resourceType === "statefulsets") {
        replicas = dep.spec?.replicas || 0;
        readyReplicas = dep.status?.readyReplicas || 0;
        strategy = dep.spec?.updateStrategy?.type || "RollingUpdate";
      } else if (resourceType === "daemonsets") {
        replicas = dep.status?.desiredNumberScheduled || 0;
        readyReplicas = dep.status?.numberReady || 0;
        strategy = dep.spec?.updateStrategy?.type || "RollingUpdate";
      } else if (resourceType === "replicasets") {
        replicas = dep.spec?.replicas || 0;
        readyReplicas = dep.status?.readyReplicas || 0;
        strategy = "ReplicaSet"; // ReplicaSets don't have update strategies
      } else {
        // Default for deployments and other resources
        replicas = dep.spec?.replicas || 0;
        readyReplicas = dep.status?.readyReplicas || 0;
        strategy = dep.spec?.strategy?.type || "RollingUpdate";
      }

      return {
        name: dep.metadata?.name || "",
        namespace: dep.metadata?.namespace || "",
        replicas: replicas,
        readyReplicas: readyReplicas,
        strategy: strategy,
        labels: Object.entries(dep.metadata?.labels || {}).map(
          ([key, value]) => `${key}: ${value as string}`
        ),
        status: inferStatus(
          dep.status,
          resourceType,
          dep.status?.conditions
        ),
        last_applied:
          dep.metadata?.annotations[
            "kubectl.kubernetes.io/last-applied-configuration"
          ],
        fullData: dep,
        showEdit: true,
        showDelete: true,
        showViewDetails: true,
      };
    }) || [];

  const handleViewDetails = (deployment: any) => {
    navigate(`/orchestration/kubernetes/${namespace}/deployments/${type}/${deployment.name}`)
  };

  const sections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Box,
      description: `Basic deployment information including metadata, labels, annotations, creation timestamp, and general configuration details.`,
      longDescription: 'This section provides a comprehensive overview of the deployment including its metadata, labels, annotations, and creation information. It shows the fundamental properties that identify and describe the deployment resource.',
      component: OverviewSection,
      props: { deployment: currentDeployment }
    },
    {
      id: 'spec',
      label: 'Specification',
      icon: Settings,
      description: 'Deployment specification including replica configuration, selectors, pod template settings, strategy, and scheduling configuration.',
      longDescription: 'The specification section details how the deployment should behave, including the number of replicas, update strategy, and pod template configuration that defines what pods should be created.',
      component: SpecificationSection,
      props: { deployment: currentDeployment }
    },
    {
      id: 'containers',
      label: 'Containers',
      icon: Server,
      description: 'Container definitions including images, commands, environment variables, ports, probes, resource configurations, and security settings.',
      longDescription: 'This section shows the container specifications within the deployment, including the container images, commands, environment variables, ports, and resource requirements.',
      component: ContainersSection,
      props: { deployment: currentDeployment }
    },
    {
      id: 'volumes',
      label: 'Volumes & Storage',
      icon: HardDrive,
      description: 'Volume mounts, persistent volumes, config maps, secrets, and storage configurations used by the deployment.',
      longDescription: 'The volumes section displays all storage configurations including persistent volumes, config maps, secrets, and other volume types that provide data persistence and configuration.',
      component: VolumesSection,
      props: { deployment: currentDeployment }
    },
    {
      id: 'networking',
      label: 'Networking',
      icon: Network,
      description: 'Network policies, service accounts, DNS configuration, affinity rules, and connectivity settings.',
      longDescription: 'Networking configuration includes service accounts, DNS policies, affinity rules, and tolerations that control how the deployment interacts with the cluster network and other resources.',
      component: NetworkingSection,
      props: { deployment: currentDeployment }
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Security contexts, service accounts, RBAC settings, capabilities, and access control configurations.',
      longDescription: 'Security settings include pod and container security contexts, user and group configurations, and other security-related settings that control access and permissions.',
      component: SecuritySection,
      props: { deployment: currentDeployment }
    },
    ...(currentDeployment?.status ? [{
      id: 'status',
      label: 'Status',
      icon: Activity,
      description: 'Current deployment status including replica counts, conditions, and rollout progress information.',
      longDescription: 'The status section shows the current state of the deployment including replica counts, conditions, and other runtime information that reflects the actual state of the deployment.',
      component: StatusSection,
      props: { deployment: currentDeployment }
    }] : [])
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        <RouteDescription
          title={
            <div className="flex items-center gap-2">
              <RocketIcon className="h-4 w-4" />
              <h2>{resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}</h2>
            </div>
          }
          shortDescription="View and manage Kubernetes Deployments—deploy and update your applications."
          description="Deployments provide declarative updates for Pods and ReplicaSets. You describe a desired state in a Deployment, and the Deployment Controller changes the actual state to the desired state at a controlled rate."
        />
        <Card className="p-4 rounded-[0.5rem] shadow-none bg-white border border-gray-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}</CardTitle>
              <CardDescription>
                {transformedDeployments.length} {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <NamespaceSelector />
              <Button onClick={() => setShowCreateDialog(true)}>
                <RocketIcon className="w-4 h-4 mr-2" />
                Create {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 shadow-none">
            <ResourceTable
              columns={columns}
              data={transformedDeployments}
              onViewDetails={handleViewDetails}
              onEdit={(res) => {
                setShowCreateDialog(true);
                setCurrentToEdit(res);
              }}
              onDelete={(data) => {
                let manifest = yaml.dump(JSON.parse(data.last_applied));
                if (!Object.keys(data.last_applied).length) {
                  manifest = yaml.dump({
                    apiVersion: data.fullData.apiVersion,
                    kind: data.fullData.kind,
                    metadata: {
                      name: data.fullData.metadata.name,
                      namespace: data.fullData.metadata.namespace,
                    },
                  });
                }
                DefaultService.apiKubernertesMethodsDeletePost({
                  requestBody: {
                    manifest: manifest,
                  },
                })
                  .then((res) => {
                    if (res.success) {
                      toast.success(res.data.message);
                      refetch();
                    } else {
                      toast.error(res.error);
                    }
                  })
                  .catch((err) => {
                    toast.error(err);
                  });
              }}
            />
          </CardContent>
        </Card>
      </div>
      
      {showCreateDialog && (
        <ResourceForm
          heading="Deployment resource"
          description="A Kubernetes Deployment is a resource used to manage and automate the rollout and lifecycle of application instances, typically in the form of Pods. It ensures that a specified number of pod replicas are running at all times and allows for declarative updates, rollbacks, and scaling. Deployments are ideal for stateless applications and provide robust features like rolling updates and version control, making them a foundational tool for maintaining reliable and consistent workloads in a Kubernetes cluster."
          editDetails={showCreateDialog}
          rawYaml={
            currentToEdit
              ? yaml.dump(
                  currentToEdit?.last_applied
                    ? JSON.parse(currentToEdit?.last_applied)
                    : currentToEdit.fullData
                )
              : ""
          }
          resourceType="deployments"
          onClose={() => {
            setShowCreateDialog(false);
            setCurrentToEdit(null);
          }}
          onUpdate={(data) => {
            DefaultService.apiKubernertesMethodsApplyPost({
              requestBody: {
                manifest: data.rawYaml,
              },
            })
              .then((res) => {
                if (res.success) {
                  toast.success(res.data.message);
                  refetch();
                  setShowCreateDialog(false);
                } else {
                  toast.error(res.error);
                }
              })
              .catch((err) => {
                toast.error(err);
              });
          }}
        />
      )}

      {showDetailsWizard && currentDeployment && (
        <Wizard
          isWizardOpen={showDetailsWizard}
          setIsWizardOpen={setShowDetailsWizard}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          steps={sections}
          heading={{
            primary: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}: ${currentDeployment.metadata?.name}`,
            secondary: `Namespace: ${currentDeployment.metadata?.namespace}`,
            icon: RocketIcon
          }}
        />
      )}
    </div>
  );
}

function inferStatus(status: any, resourceType: string, conditions?: any): string {
  // Handle case where conditions is not an array but a status object
  if (["statefulsets","daemonsets","replicasets"].includes(resourceType)) {
    // This is likely a status object, not conditions array
    const statusObj = status;
    
    // Handle different resource types based on their status patterns
    if (resourceType === "statefulsets") {
      // StatefulSet status logic
      const desiredReplicas = statusObj.replicas || 0;
      const readyReplicas = statusObj.readyReplicas || 0;
      const currentReplicas = statusObj.currentReplicas || 0;
      
      if (readyReplicas === desiredReplicas && currentReplicas === desiredReplicas) {
        return "Running";
      } else if (readyReplicas > 0 && readyReplicas < desiredReplicas) {
        return "Scaling";
      } else if (readyReplicas === 0 && desiredReplicas > 0) {
        return "Pending";
      } else if (statusObj.conditions) {
        // Check conditions for more specific status
        const failedCondition = statusObj.conditions.find((c: any) => 
          c.type === "Failed" && c.status === "True"
        );
        if (failedCondition) return "Failed";
      }
      return "Pending";
    }
    
    if (resourceType === "daemonsets") {
      // DaemonSet status logic
      const desired = statusObj.desiredNumberScheduled || 0;
      const ready = statusObj.numberReady || 0;
      const available = statusObj.numberAvailable || 0;
      
      if (ready === desired && available === desired) {
        return "Running";
      } else if (ready > 0 && ready < desired) {
        return "Scaling";
      } else if (ready === 0 && desired > 0) {
        return "Pending";
      } else if (statusObj.conditions) {
        const failedCondition = statusObj.conditions.find((c: any) => 
          c.type === "Failed" && c.status === "True"
        );
        if (failedCondition) return "Failed";
      }
      return "Pending";
    }
    
    if (resourceType === "replicasets") {
      // ReplicaSet status logic
      const desiredReplicas = statusObj.replicas || 0;
      const readyReplicas = statusObj.readyReplicas || 0;
      const availableReplicas = statusObj.availableReplicas || 0;
      console.log({desiredReplicas,readyReplicas,availableReplicas})
      if (readyReplicas === desiredReplicas && availableReplicas === desiredReplicas) {
        return "Running";
      } else if (readyReplicas > 0 && readyReplicas < desiredReplicas) {
        return "Scaling";
      } else if (readyReplicas === 0 && desiredReplicas > 0) {
        return "Pending";
      }
      return "Pending";
    }
    
    // Default fallback for other resource types
    return "Unknown";
  }

  // Handle conditions array (for Deployments and other resources with conditions)
  if (!conditions || conditions.length === 0) return "Unknown";
  
  const progressingCondition = conditions.find((c: any) => c.type === "Progressing");
  const availableCondition = conditions.find((c: any) => c.type === "Available");
  const readyCondition = conditions.find((c: any) => c.type === "Ready");
  const failedCondition = conditions.find((c: any) => c.type === "Failed");
  
  // Check for failed state first
  if (failedCondition?.status === "True") {
    return "Failed";
  }
  
  // Check for available/ready state
  const isAvailable = availableCondition?.status === "True" || readyCondition?.status === "True";
  const isProgressing = progressingCondition?.status === "True";
  
  if (isAvailable) {
    return "Running";
  } else if (isProgressing) {
    return "Pending";
  } else if (availableCondition?.status === "False" || readyCondition?.status === "False") {
    return "Failed";
  }
  
  return "Pending";
}
