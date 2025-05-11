import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { Handle } from 'reactflow';
import { Server, Box, Globe2, Cpu, HardDrive, MemoryStick as Memory,Layers, Network } from 'lucide-react';
import { 
    useReactFlow
  } from 'reactflow';

const ResourceBar: React.FC<{ 
  label: string, 
  used: string, 
  total: string, 
  percentage: number,
  icon: React.ReactNode
}> = ({ label, used, total, percentage, icon }) => (
  <div className="mb-2">
    <div className="flex items-center justify-between text-xs mb-1">
      <div className="flex items-center gap-1">
        {icon}
        <span>{label}</span>
      </div>
      <span>{used} / {total}</span>
    </div>
    <div className="w-full h-1.5 bg-gray-200 rounded-full">
      <div 
        className={`h-full rounded-full ${
          percentage > 90 ? 'bg-red-500' : 
          percentage > 70 ? 'bg-yellow-500' : 
          'bg-green-500'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

export const NodeComponent = memo(({
  data: { data },
  targetPosition,
  sourcePosition,
}) => {
  return (
    <div className="relative max-w-[300px]">
      <Handle type="target" position={targetPosition} />
      <div className="bg-white p-4 rounded-lg shadow-lg border-2 min-w-[300px]">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5" />
          <h3 className="font-semibold w-[70%]">{data.name}</h3>
          <span
            className={`text-xs px-2 py-1 rounded ${
              data.status === "Ready"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {data.status}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Role:</span>
              <span className="ml-2 font-medium">{data.role}</span>
            </div>
            <div>
              <span className="text-gray-600">Version:</span>
              <span className="ml-2 font-medium">{data.version}</span>
            </div>
            <div>
              <span className="text-gray-600">OS:</span>
              <span className="ml-2 font-medium">{data.os}</span>
            </div>
            <div>
              <span className="text-gray-600">Arch:</span>
              <span className="ml-2 font-medium">{data.architecture}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <ResourceBar
              label="CPU"
              used={data.resources.cpu.used}
              total={data.resources.cpu.total}
              percentage={data.resources.cpu.percentage}
              icon={<Cpu className="w-4 h-4" />}
            />
            <ResourceBar
              label="Memory"
              used={data.resources.memory.used}
              total={data.resources.memory.total}
              percentage={data.resources.memory.percentage}
              icon={<Memory className="w-4 h-4" />}
            />
            <ResourceBar
              label="Storage"
              used={data.resources.storage?.used || "0"}
              total={data.resources.storage?.total || "0"}
              percentage={data.resources.storage?.percentage || 0}
              icon={<HardDrive className="w-4 h-4" />}
            />
          </div>

        </div>
      </div>
      <Handle type="source" position={sourcePosition} />
    </div>
  );
});

export const PodComponent = memo(({
  data: { data },
  targetPosition,
  sourcePosition,
}) => {
    const { fitView } = useReactFlow();
 
    const moveToDeployment = useCallback(
      (id: string) => fitView({ nodes: [{ id }] }),
      [fitView],)

  return (
    <div className="relative max-w-[300px]">
      <Handle type="target" position={targetPosition} />

      <div className="bg-white p-4 rounded-lg shadow-lg border-2 min-w-[300px]">
        <div className="flex items-start gap-2 mb-1">
          <Box className="w-4 h-4" />
          <div className='cursor-pointer' onClick={()=>{
                moveToDeployment(data.parent_id)
            }}>
            <h4 className="font-medium text-sm">({data.belongs_to})</h4>
          </div>
        </div>
        <div className='mb-3'>
            <h3 className="font-semibold text-blue-900 w-[70%]">{data.name}</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                data.status === "Running"
                  ? "bg-green-100 text-green-800"
                  : data.status === "Succeeded"
                ? "bg-green-100 text-green-800"
                  : data.status === "Pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {data.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Restarts:</span>
            <span>{data.restarts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Age:</span>
            <span>{data.age}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">IP:</span>
            <span>{data.ip}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <ResourceBar
            label="CPU"
            used={data.resources.cpu.used}
            total={data.resources.cpu.total}
            percentage={data.resources.cpu.percentage}
            icon={<Cpu className="w-3 h-3" />}
          />
          <ResourceBar
            label="Memory"
            used={data.resources.memory.used}
            total={data.resources.memory.total}
            percentage={data.resources.memory.percentage}
            icon={<Memory className="w-3 h-3" />}
          />
        </div>
      </div>

      <Handle type="source" position={sourcePosition} />
    </div>
  );
});

export const ServiceComponent = memo(({
  data: { data },
  targetPosition,
  sourcePosition,
}) => {
   
  return (
    <div className="relative max-w-[300px] max-h-[350px]">
      <Handle type="target" position={targetPosition} />
      <div className="bg-white p-4 rounded-lg shadow-lg border-2 min-w-[300px]">
        <div className="flex items-start gap-2 mb-1">
          <Globe2 className="w-4 h-4" />
          <div >
            <h4 className="font-medium  text-sm">({data.belongs_to})</h4>
          </div>
        </div>
        <div className='mb-3'>
            <h3 className="font-semibold text-blue-900 w-[70%]">{data.service_name}</h3>

        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span>{data.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cluster IP:</span>
            <span>{data.clusterIP}</span>
          </div>
          {data.externalIP && (
            <div className="flex justify-between">
              <span className="text-gray-600">External IP:</span>
              <span>{data.externalIP}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Age:</span>
            <span>{data.age}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <h4 className="text-sm font-medium mb-2">Ports</h4>
          <div className="space-y-1">
            {data.ports.map((port, idx) => (
              <div
                key={idx}
                className="text-xs flex items-center justify-between"
              >
                <span>{port.port}</span>
                <span>→</span>
                <span>{port.targetPort}</span>
                <span className="text-gray-500">({port.protocol})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Handle type="source" position={sourcePosition} />
    </div>
  );
});

export const CronJobComponent = memo(({
    id,
    data: { data },
    targetPosition,
    sourcePosition,
    ...props
  }) => {
    const { fitView } = useReactFlow();
    
    const moveToPod = useCallback(
      (key:string,podIndex: string) => fitView({ nodes: [{ id:`${id}_${key}_${podIndex}` }] }),
      [fitView],)
    const name = data.cronjob_name

    return (
      <div className="relative max-w-[300px]">
        <Handle type="target" position={targetPosition} />
        
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 min-w-[300px]">
          <div className="flex items-start gap-2 mb-1">
            <Layers className="w-5 h-5" />
            <div>
            <h4 className="font-medium  text-sm">(Cronjob)</h4>
            </div>

          </div>
          <div className='mb-3'>
            <h3 className="font-semibold text-blue-900 w-[70%]">{name}</h3>

          </div>
          <div className="space-y-2">
            {data.pods.map((pod, podIndex) => (
                <div 
                    key={podIndex}
                    className="bg-gray-50 hover:bg-gray-100 rounded p-2 text-sm cursor-pointer"
                    onClick={() =>{
                        moveToPod("pods",podIndex)
                    } }
                >
                    <div className="flex items-strat justify-between mb-2">
                    <div className="flex items-start gap-2">
                        <Box className="w-4 h-4" />
                        <span className="w-[70%] text-xs">{pod.name}</span>
                    </div>
                    <span
                        className={`px-2 py-0.5 rounded text-xs h-[max-content] ${
                        pod.status === "Running"
                            ? "bg-green-100 text-green-800"
                            : pod.status === "Succeeded"
                        ? "bg-green-100 text-green-800"
                            : pod.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                    >
                        {pod.status}
                    </span>
                    </div>
                </div>
            ))}
        </div>
        </div>
  
        <Handle type="source" position={sourcePosition} />
      </div>
    );
});

export const JobComponent = memo(({
    id,
    data: { data },
    targetPosition,
    sourcePosition,
    ...props
  }) => {
    const { fitView } = useReactFlow();
    
    const moveToPod = useCallback(
      (key:string,podIndex: string) => fitView({ nodes: [{ id:`${id}_${key}_${podIndex}` }] }),
      [fitView],)
    const name = data.job_name

    return (
      <div className="relative max-w-[300px]">
        <Handle type="target" position={targetPosition} />
        
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 min-w-[300px]">
          <div className="flex items-start gap-2 mb-1">
            <Layers className="w-5 h-5" />
            <div>
            <h4 className="font-medium  text-sm">(Jobs)</h4>
            </div>

          </div>
          <div className='mb-3'>
            <h3 className="font-semibold text-blue-900 w-[70%]">{name}</h3>

          </div>
          <div className="space-y-2">
            {data.pods.map((pod, podIndex) => (
                <div 
                    key={podIndex}
                    className="bg-gray-50 hover:bg-gray-100 rounded p-2 text-sm cursor-pointer"
                    onClick={() =>{
                        moveToPod("pods",podIndex)
                    } }
                >
                    <div className="flex items-strat justify-between mb-2">
                    <div className="flex items-start gap-2">
                        <Box className="w-4 h-4" />
                        <span className="w-[70%] text-xs">{pod.name}</span>
                    </div>
                    <span
                        className={`px-2 py-0.5 rounded text-xs h-[max-content] ${
                        pod.status === "Running"
                            ? "bg-green-100 text-green-800"
                            : pod.status === "Succeeded"
                        ? "bg-green-100 text-green-800"
                            : pod.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                    >
                        {pod.status}
                    </span>
                    </div>
                </div>
            ))}
        </div>
        </div>
  
        <Handle type="source" position={sourcePosition} />
      </div>
    );
});

export const DeploymentComponentV2 = memo(({
    id,
    data: { data },
    targetPosition,
    sourcePosition,
    ...props
  }) => {
    const { fitView } = useReactFlow();
    
    const moveToPod = useCallback(
      (key:string,podIndex: string) => fitView({ nodes: [{ id:`${id}_${key}_${podIndex}` }] }),
      [fitView],)
      
    const deploymentsInfoName = useMemo(()=>{
        return {
            type:"deployment_name" in data
                ? "ReplicaSet"
                : "statefulset_name" in data
                ? "StatefulSet"
                : "daemonset_name" in data
                ? "DaemonSets"
                : data.belongs_to,
            name:"deployment_name" in data
                ? data.deployment_name
                : "statefulset_name" in data
                ? data.statefulset_name
                : "daemonset_name" in data
                ? data.daemonset_name
                : ''
        }
    },[data]);

    return (
      <div className="relative max-w-[300px]">
        <Handle type="target" position={targetPosition} />
        
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 min-w-[300px]">
          <div className="flex items-start gap-2 mb-1">
            <Layers className="w-5 h-5" />
            <div>
            <h4 className="font-medium  text-sm">({deploymentsInfoName.type})</h4>
            </div>

          </div>
          <div className='mb-3'>
            <h3 className="font-semibold text-blue-900 w-[70%]">{deploymentsInfoName.name}</h3>

          </div>
          <div className="space-y-4">
            <DeploymentsInfo deploymentSets={{...data,name:''}} index={0} moveToPod={moveToPod}/>
          </div>
        </div>
  
        <Handle type="source" position={sourcePosition} />
      </div>
    );
});

export const DeploymentComponent = memo(({
    id,
    data: { data },
    targetPosition,
    sourcePosition,
    ...props
  }) => {
    const { fitView } = useReactFlow();
    
    const moveToPod = useCallback(
      (key:string,podIndex: string) => fitView({ nodes: [{ id:`${id}_${key}_${podIndex}` }] }),
      [fitView],)

    return (
      <div className="relative max-w-[300px]">
        <Handle type="target" position={targetPosition} />
        
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 min-w-[300px]">
          <div className="flex items-start gap-2 mb-1">
            <Layers className="w-5 h-5" />
            <div>
                <h4 className="font-medium  text-sm">({"replicasets" in data ? "ReplicaSet" :("statefulsets" in data ? "StatefulSet":("daemonsets" in data ?"DaemonSets":data.belongs_to))})</h4>
            </div>

          </div>
          <div className='mb-3'>
            <h3 className="font-semibold text-blue-900 w-[70%]">{data.deployment_name}</h3>

          </div>

          <div className="space-y-4">
            {data.replicasets?.map((replicaset, index) => (
              <DeploymentsInfo deploymentSets={replicaset} index={index} moveToPod={moveToPod}/>
            ))}
            {data.statefulsets?.map((statefulset, index) => (
              <DeploymentsInfo deploymentSets={statefulset} index={index} moveToPod={moveToPod}/>
            ))}
            {data.daemonsets?.map((daemonset, index) => (
              <DeploymentsInfo deploymentSets={daemonset} index={index} moveToPod={moveToPod}/>
            ))}
          </div>
        </div>
  
        <Handle type="source" position={sourcePosition} />
      </div>
    );
  });

const DeploymentsInfo = memo(({deploymentSets,index,moveToPod})=>{
    
    return (
        <div key={index} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium w-[65%]">{deploymentSets.name}</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {deploymentSets.available_replicas}/{deploymentSets.expected_replicas} replicas
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                {deploymentSets.pods.map((pod, podIndex) => (
                <div 
                    key={podIndex}
                    className="bg-gray-50 hover:bg-gray-100 rounded p-2 text-sm cursor-pointer"
                    onClick={() =>{
                        moveToPod("pods",podIndex)
                    } }
                >
                    <div className="flex items-strat justify-between mb-2">
                    <div className="flex items-start gap-2">
                        <Box className="w-4 h-4" />
                        <span className="w-[70%] text-xs">{pod.name}</span>
                    </div>
                    <span
                        className={`px-2 py-0.5 rounded text-xs h-[max-content] ${
                        pod.status === "Running"
                            ? "bg-green-100 text-green-800"
                            : pod.status === "Succeeded"
                        ? "bg-green-100 text-green-800"
                            : pod.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                    >
                        {pod.status}
                    </span>
                    </div>
                </div>
                ))}
            </div>
        </div>
    )
})

export const CustomIngressNode = memo(({
    id,
    data: { data },
    targetPosition,
    sourcePosition,
  }) => {
    const { fitView } = useReactFlow();
 
    const moveToService = useCallback(
        (serviceIndex: string) => fitView({ nodes: [{ id:`${id}_services_${serviceIndex}` }] }),
        [fitView],)

    return (
      <div className="relative max-w-[350px]">
        <Handle type="target" position={targetPosition} />
  
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 min-w-[300px]">
          <div className="flex gap-2 mb-1 items-start">
            <Network className="w-5 h-5 text-blue-600" />
            <div>
                <h4 className="font-medium  text-sm">({data.belongs_to})</h4>
            </div>
          </div>
          <div className='mb-3'>
            <h3 className="font-semibold text-blue-900 w-[70%]">{data.ingress_name}</h3>
          </div>
  
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe2 className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm text-blue-900">{data.host}</span>
              </div>
            </div>
  
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-800">Connected Services</h4>
              </div>
              <div className="grid gap-2">
                {data.paths.map((service, idx) => (
                  <div
                    key={idx}
                    className="cursor-pointer flex items-center gap-2 text-sm bg-gray-50 hover:bg-gray-100 transition-colors duration-150 text-gray-700 px-3 py-2 rounded-md"
                    onClick={()=>moveToService(idx)}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className='flex items-center gap-2'>
                        <span className="font-mono text-xs">{service.path}{" ->"}</span>
                        <span className="font-mono text-xs">{service.service_name}</span>
                        <span className="font-mono text-xs">({service.path_type})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
  
        <Handle type="source" position={sourcePosition} />
      </div>
    );
  });