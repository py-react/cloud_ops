import React, { useState, useCallback, useRef, useMemo, memo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Globe2, 
  Network, 
  Layers, 
  Box, 
  Plus, 
  Info,
  AlertCircle,
  Settings2,
  X,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import Editor from '@monaco-editor/react';
import jsyaml from 'js-yaml';
import {
  NodeComponent,
  PodComponent,
  ServiceComponent,
  DeploymentComponent,
  CustomIngressNode,
  DeploymentComponentV2,
  CronJobComponent,
  JobComponent
} from '@/components/kubernetes/react-flow/cutomNodes/customNodes';


const nodeTypes = {
  node: NodeComponent,
  service: ServiceComponent,
  pod: PodComponent,
  deployment: DeploymentComponent,
  deploymentV2: DeploymentComponentV2,
  ingress: CustomIngressNode,
  cronjob: CronJobComponent,
  job: JobComponent
};

const VALID_CONNECTIONS: Record<string, string[]> = {
  ingress: ['service'],
  service: ['deploymentV2', 'pod', 'cronjob', 'job', 'deployment'],
  deploymentV2: ['pod'],
  deployment: ['pod'],
  cronjob: ['job'],
  job: ['pod'],
};

const Sidebar = ({ availableComponents }: { availableComponents: any[] }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string, defaultData: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(defaultData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-72 bg-slate-50 border-r flex flex-col h-full shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
      <div className="p-6 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg ring-1 ring-primary/20">
            <Plus className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 tracking-tight uppercase">Palette</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 font-medium">Drag components to the canvas</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {availableComponents.map((comp) => {
          const Icon = comp.type === 'ingress' ? Globe2 : 
                       comp.type === 'service' ? Network : 
                       comp.type === 'deploymentV2' ? Layers : Box;
          
          return (
            <div
              key={comp.type}
              className="group relative flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-grab hover:border-primary hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all active:scale-95"
              onDragStart={(event) => onDragStart(event, comp.type, comp.defaultData)}
              draggable
            >
              <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors ring-1 ring-slate-200 group-hover:ring-primary/20">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 leading-none">{comp.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-wider">{comp.defaultData.belongs_to}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-4 h-4 text-primary" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 m-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Connect nodes according to <span className="font-bold text-slate-900">Kubernetes traffic flow</span>. Invalid connections will be blocked.
          </p>
        </div>
      </div>
    </div>
  );
};

const generateDefaultYaml = (type: string, data: any) => {
  const name = data.ingress_name || data.service_name || data.deployment_name || data.name || "new-resource";
  
  if (type === 'service') {
    return `apiVersion: v1
kind: Service
metadata:
  name: ${name}
spec:
  type: ${data.type || 'ClusterIP'}
  selector:
    app: ${name}
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP`;
  }
  
  if (type === 'deploymentV2' || type === 'deployment') {
    return `apiVersion: apps/v1
kind: ${data.component_type === 'statefulset' ? 'StatefulSet' : data.component_type === 'daemonset' ? 'DaemonSet' : 'Deployment'}
metadata:
  name: ${name}
  labels:
    app: ${name}
spec:
  replicas: ${data.expected_replicas || 1}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
      - name: container-1
        image: nginx:latest
        ports:
        - containerPort: 8080`;
  }

  if (type === 'ingress') {
    return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${name}
spec:
  rules:
  - host: ${data.host || 'example.com'}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: target-service
            port:
              number: 80`;
  }

  if (type === 'pod') {
    return `apiVersion: v1
kind: Pod
metadata:
  name: ${name}
spec:
  containers:
  - name: main
    image: alpine
    command: ["sleep", "3600"]`;
  }

  return `# YAML for ${type}\nkind: Unknown`;
};

const ConfigPanel = ({ 
  selectedNode, 
  onUpdate, 
  onClose, 
  onDelete,
  addNodes,
  addEdges,
  nodes
}: { 
  selectedNode: any, 
  onUpdate: (id: string, data: any) => void, 
  onClose: () => void, 
  onDelete: (id: string) => void,
  addNodes: (nds: any[]) => void,
  addEdges: (eds: any[]) => void,
  nodes: any[]
}) => {
  if (!selectedNode) return null;

  const data = selectedNode.data.data;
  const initialYaml = data.yaml || generateDefaultYaml(selectedNode.type, data);
  const [localYaml, setLocalYaml] = useState(initialYaml);
  
  const handleSave = () => {
    try {
      const parsed = jsyaml.load(localYaml) as any;
      if (!parsed || typeof parsed !== 'object' || !parsed.kind) {
        toast.error("No valid Kubernetes resource found in YAML");
        return;
      }

      const name = parsed.metadata?.name || data.name;
      const kind = parsed.kind?.toLowerCase();
      
      // Determine the React Flow node type based on kind
      const newNodeType = kind === 'service' ? 'service' : 
                         kind === 'ingress' ? 'ingress' : 
                         kind === 'pod' ? 'pod' : 'deploymentV2';

      const updatedData = { 
        ...data, 
        yaml: localYaml,
        component_type: kind,
        pods: data.pods || [],
        available_replicas: data.available_replicas || 0,
        status: data.status || "Pending",
        clusterIP: parsed.spec?.clusterIP || "Pending",
        externalIP: parsed.spec?.externalIPs?.[0] || "",
        host: parsed.spec?.rules?.[0]?.host || "N/A",
        type: parsed.spec?.type || "ClusterIP",
        name: name,
        labels: parsed.metadata?.labels || {},
        containers: [] as any[]
      };

      // Sync Containers for Workloads and Pods
      const podSpec = parsed.spec?.template?.spec || parsed.spec;
      if (podSpec?.containers) {
        updatedData.containers = podSpec.containers.map((c: any) => ({
          name: c.name,
          image: c.image,
          ports: c.ports?.map((p: any) => p.containerPort) || []
        }));
      }
      
      if (kind === 'deployment') updatedData.deployment_name = name;
      else if (kind === 'service') updatedData.service_name = name;
      else if (kind === 'ingress') updatedData.ingress_name = name;
      
      updatedData.name = name;

      // Sync replicas
      if (parsed.spec?.replicas !== undefined) updatedData.expected_replicas = parsed.spec.replicas;

      // Sync Service Ports
      if (kind === 'service' && parsed.spec?.ports) {
        updatedData.ports = parsed.spec.ports.map((p: any) => ({
          port: p.port,
          targetPort: p.targetPort,
          protocol: p.protocol || 'TCP'
        }));
      } else if (kind === 'service') {
        updatedData.ports = [];
      }

      // Sync Ingress Paths
      if (kind === 'ingress' && parsed.spec?.rules?.[0]?.http?.paths) {
        updatedData.paths = parsed.spec.rules[0].http.paths.map((p: any) => ({
          path: p.path,
          service_name: p.backend?.service?.name || 'unknown',
          path_type: p.pathType || 'Prefix'
        }));
      } else if (kind === 'ingress') {
        updatedData.paths = [];
      }

      // Logic for Pod Generation (Workloads)
      if (parsed.spec?.replicas !== undefined && (kind === 'deployment' || kind === 'statefulset')) {
         const replicas = parsed.spec.replicas;
         const currentPodsCount = (updatedData.pods || []).length;
         if (currentPodsCount < replicas) {
            const numToCreate = replicas - currentPodsCount;
            const startPos = selectedNode.position;
            const podNewNodes: any[] = [];
            const podNewEdges: any[] = [];

            for (let i = 0; i < numToCreate; i++) {
                const podId = `pod-auto-${Date.now()}-${i}`;
                const podName = `${name}-auto-${currentPodsCount + i + 1}`;
                
                const podNode = {
                  id: podId,
                  type: 'pod',
                  position: { 
                    x: startPos.x + 450, 
                    y: startPos.y + (i * 180) - ((numToCreate - 1) * 90)
                  },
                  data: {
                    data: {
                      name: podName,
                      component_type: "pod",
                      status: "Pending",
                      restarts: 0,
                      age: "0s",
                      ip: "N/A",
                      resources: {
                        cpu: { used: "0", total: "0.1", percentage: "0" },
                        memory: { used: "0Mi", total: "64Mi", percentage: "0" }
                      },
                      belongs_to: "Compute",
                      is_auto_generated: true // Mark as auto-generated
                    }
                  },
                  sourcePosition: Position.Right,
                  targetPosition: Position.Left,
                };

                const edge = {
                  id: `edge-${selectedNode.id}-${podId}`,
                  source: selectedNode.id,
                  target: podId,
                  animated: true,
                  style: { stroke: '#0f172a', strokeWidth: 2 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#0f172a' }
                };

                podNewNodes.push(podNode);
                podNewEdges.push(edge);
                updatedData.pods = [...(updatedData.pods || []), podNode.data.data];
            }
            addNodes(podNewNodes);
            addEdges(podNewEdges);
         }
      }

      // Connection Discovery
      const newEdges: any[] = [];
      const allCurrentNodes = [...nodes.filter(n => n.id !== selectedNode.id), { ...selectedNode, data: { ...selectedNode.data, data: updatedData } }];

      if (kind === 'service' && parsed.spec?.selector) {
          const selector = parsed.spec.selector;
          allCurrentNodes.forEach(target => {
              if (target.id === selectedNode.id) return;
              const tKind = target.data?.data?.component_type || target.type;
              if (tKind === 'deployment' || tKind === 'statefulset' || tKind === 'pod' || tKind === 'deploymentV2') {
                  const tYaml = target.data.data.yaml || generateDefaultYaml(target.type, target.data.data);
                  const tParsed = jsyaml.load(tYaml) as any;
                  const labels = { ...(tParsed?.metadata?.labels || {}), ...(tParsed?.spec?.template?.metadata?.labels || {}) };
                  if (Object.keys(selector).length > 0 && Object.entries(selector).every(([k, v]) => labels[k] === v)) {
                      newEdges.push({
                          id: `edge-${selectedNode.id}-${target.id}`,
                          source: selectedNode.id,
                          target: target.id,
                          animated: true,
                          style: { stroke: '#0f172a', strokeWidth: 2 },
                          markerEnd: { type: MarkerType.ArrowClosed, color: '#0f172a' }
                      });
                  }
              }
          });
      } else if (kind === 'deployment' || kind === 'statefulset' || kind === 'pod') {
          const labels = { 
            ...(parsed.metadata?.labels || {}), 
            ...(parsed.spec?.template?.metadata?.labels || {}) 
          };
          allCurrentNodes.forEach(node => {
              if (node.id === selectedNode.id) return;
              if (node.type === 'service') {
                  const sYaml = node.data.data.yaml || generateDefaultYaml(node.type, node.data.data);
                  const sParsed = jsyaml.load(sYaml) as any;
                  const selector = sParsed?.spec?.selector || {};
                  if (Object.keys(selector).length > 0 && Object.entries(selector).every(([k, v]) => labels[k] === v)) {
                      newEdges.push({
                          id: `edge-${node.id}-${selectedNode.id}`,
                          source: node.id,
                          target: selectedNode.id,
                          animated: true,
                          style: { stroke: '#0f172a', strokeWidth: 2 },
                          markerEnd: { type: MarkerType.ArrowClosed, color: '#0f172a' }
                      });
                  }
              }
          });
      } else if (kind === 'ingress') {
          const serviceNames = (updatedData.paths || []).map((p: any) => p.service_name);
          allCurrentNodes.forEach(node => {
              if (node.id === selectedNode.id) return;
              if (node.type === 'service') {
                  const sName = node.data?.data?.name || node.data?.data?.service_name;
                  if (serviceNames.includes(sName)) {
                      newEdges.push({
                          id: `edge-${selectedNode.id}-${node.id}`,
                          source: selectedNode.id,
                          target: node.id,
                          animated: true,
                          style: { stroke: '#0f172a', strokeWidth: 2 },
                          markerEnd: { type: MarkerType.ArrowClosed, color: '#0f172a' }
                      });
                  }
              }
          });
      }

      // Reverse Ingress Scan for Services
      if (kind === 'service') {
          const sName = name;
          allCurrentNodes.forEach(node => {
              if (node.id === selectedNode.id) return;
              if (node.type === 'ingress') {
                  const paths = node.data?.data?.paths || [];
                  if (paths.some((p: any) => p.service_name === sName)) {
                      newEdges.push({
                          id: `edge-${node.id}-${selectedNode.id}`,
                          source: node.id,
                          target: selectedNode.id,
                          animated: true,
                          style: { stroke: '#0f172a', strokeWidth: 2 },
                          markerEnd: { type: MarkerType.ArrowClosed, color: '#0f172a' }
                      });
                  }
              }
          });
      }

      onUpdate(selectedNode.id, { ...selectedNode.data, data: updatedData }, newNodeType);
      if (newEdges.length > 0) addEdges(newEdges);

      onClose();
      toast.success("Configuration applied");
    } catch (e) {
      toast.error(`YAML Error: ${e instanceof Error ? e.message : 'Invalid format'}`);
    }
  };

  return (
    <div className="w-[500px] bg-white border-l flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-[1000]">
      <div className="p-6 border-b flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg ring-1 ring-primary/20">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 tracking-tight uppercase text-xs">Resource Definition</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{selectedNode.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => onDelete(selectedNode.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Delete Component"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-200 mx-1" />
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-[#1e1e1e]">
        <Editor
          height="100%"
          defaultLanguage="yaml"
          theme="vs-dark"
          value={localYaml}
          onChange={(val) => setLocalYaml(val || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16 }
          }}
        />
      </div>

      <div className="p-4 bg-slate-50 border-t flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Info className="w-3 h-3" />
          <span>Validates on deployment</span>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onClose}
                className="px-4 py-1.5 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-100 transition-all"
            >
            Cancel
            </button>
            <button 
                onClick={handleSave}
                className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all shadow-sm"
            >
            Save & Close
            </button>
        </div>
      </div>
    </div>
  );
};

function FlowV2({ availableComponents }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const onUpdateNode = useCallback((id: string, newData: any, newType?: string) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        return { 
          ...node, 
          type: newType || node.type,
          data: newData 
        };
      }
      return node;
    }));
  }, [setNodes]);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ 
        ...params, 
        animated: true, 
        style: { stroke: '#0f172a', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#0f172a',
        },
      }, eds));

      // Logic to sync Pods with Workloads on connection
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (sourceNode?.type?.startsWith('deployment') && targetNode?.type === 'pod') {
        const podData = targetNode.data.data;
        onUpdateNode(sourceNode.id, {
          ...sourceNode.data,
          data: {
            ...sourceNode.data.data,
            available_replicas: (sourceNode.data.data.available_replicas || 0) + 1,
            pods: [...(sourceNode.data.data.pods || []), podData]
          }
        });
        toast.success(`Linked Pod "${podData.name}" to "${sourceNode.data.data.deployment_name}"`);
      }
    },
    [setEdges, nodes, onUpdateNode]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data?.data?.is_auto_generated) {
      toast.info("This pod is managed by a Deployment and cannot be edited directly.");
      return;
    }
    setSelectedNodeId(node.id);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const dataStr = event.dataTransfer.getData('application/reactflow-data');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { data: JSON.parse(dataStr) },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const isValidConnection = useCallback(
    (connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      const allowedTargets = VALID_CONNECTIONS[sourceNode.type as string] || [];
      const isValid = allowedTargets.includes(targetNode.type as string);

      if (!isValid) {
        toast.error(`Architecture Constraint: ${sourceNode.type} cannot target ${targetNode.type}`, {
            icon: <AlertCircle className="w-4 h-4 text-red-500" />
        });
      }

      return isValid;
    },
    [nodes]
  );

  return (
    <PageLayout
      title="Infrastructure Architect"
      subtitle={
        <div className="flex items-center gap-2">
            <span>Design your cluster topology with drag-and-drop components.</span>
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px] font-bold uppercase tracking-wider">Preview Mode</span>
        </div>
      }
      icon={Layers}
    >
      <div className="flex w-full h-[calc(100vh-200px)] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
        <Sidebar availableComponents={availableComponents} />
        
        <div className="flex-1 relative bg-slate-50/50" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            isValidConnection={isValidConnection}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background color="#e2e8f0" gap={20} variant={BackgroundVariant.Lines} />
            <Controls position="bottom-right" className="bg-white border-slate-200 shadow-lg rounded-lg overflow-hidden" />
            <Panel position="top-right" className="bg-white/90 p-2 rounded-lg border border-slate-200 shadow-sm text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Interactive Canvas
            </Panel>
          </ReactFlow>
        </div>

        {selectedNodeId && (
          <ConfigPanel 
            selectedNode={selectedNode} 
            onUpdate={onUpdateNode}
            onClose={() => setSelectedNodeId(null)}
            onDelete={onDeleteNode}
            addNodes={(newNodes) => setNodes((nds) => nds.concat(newNodes))}
            addEdges={(newEdges) => setEdges((eds) => eds.concat(newEdges))}
            nodes={nodes}
          />
        )}
      </div>
    </PageLayout>
  );
}

const FlowV2Wrapper = (props) => (
  <ReactFlowProvider>
    <FlowV2 {...props} />
  </ReactFlowProvider>
);

export default FlowV2Wrapper;
