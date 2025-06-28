import React, { useState } from "react";
import { Control, useFieldArray, useWatch } from "react-hook-form";
import { FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReleaseConfigFormData, ContainerConfig } from "../ReleaseConfigForm";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";
import { ChevronDown, X, Check } from "lucide-react";

interface ContainersSectionProps {
  control: Control<ReleaseConfigFormData>;
}

export const ContainersSection: React.FC<ContainersSectionProps> = ({ control }) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "containers"
  });
  const containers = useWatch({ control, name: "containers" }) || [];

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [name, setName] = useState("");
  // Subfields
  const [ports, setPorts] = useState<{ port: number; target_port: number; protocol: string }[]>([]);
  const [env, setEnv] = useState<{ name: string; value: string }[]>([]);
  const [command, setCommand] = useState<string[]>([]);
  const [args, setArgs] = useState<string[]>([]);
  const [resources, setResources] = useState<{ requests: Record<string, string>; limits: Record<string, string> }>({ requests: {}, limits: {} });

  // Port editing state
  const [portNumber, setPortNumber] = useState("");
  const [targetPort, setTargetPort] = useState("");
  const [portProtocol, setPortProtocol] = useState("TCP");
  const [portEditIdx, setPortEditIdx] = useState<number | null>(null);
  const [isPortsPopoverOpen, setIsPortsPopoverOpen] = useState(false);

  // Env editing state
  const [envName, setEnvName] = useState("");
  const [envValue, setEnvValue] = useState("");
  const [envEditIdx, setEnvEditIdx] = useState<number | null>(null);
  const [isEnvPopoverOpen, setIsEnvPopoverOpen] = useState(false);

  // Command editing state
  const [commandInput, setCommandInput] = useState("");
  const [commandEditIdx, setCommandEditIdx] = useState<number | null>(null);
  const [isCommandPopoverOpen, setIsCommandPopoverOpen] = useState(false);

  // Args editing state
  const [argsInput, setArgsInput] = useState("");
  const [argsEditIdx, setArgsEditIdx] = useState<number | null>(null);
  const [isArgsPopoverOpen, setIsArgsPopoverOpen] = useState(false);

  // Resource editing state
  const [isResourcesPopoverOpen, setIsResourcesPopoverOpen] = useState(false);
  const [resourceType, setResourceType] = useState<"requests" | "limits">("requests");
  const [resourceKey, setResourceKey] = useState("");
  const [resourceValue, setResourceValue] = useState("");
  const [resourceEditKey, setResourceEditKey] = useState<string | null>(null);

  // Add/Edit container
  const handleAddOrUpdate = () => {
    if (!name) return;
    const containerObj: ContainerConfig = {
      name,
      ports: ports.length > 0 ? ports : undefined,
      env: env.length > 0 ? env : undefined,
      command: command.length > 0 ? command : undefined,
      args: args.length > 0 ? args : undefined,
      resources: (Object.keys(resources.requests).length > 0 || Object.keys(resources.limits).length > 0) ? resources : undefined,
    };
    if (editIdx !== null) {
      update(editIdx, containerObj);
      setEditIdx(null);
    } else {
      append(containerObj);
    }
    setName("");
    setPorts([]);
    setEnv([]);
    setCommand([]);
    setArgs([]);
    setResources({ requests: {}, limits: {} });
  };

  const handleEdit = (row: any) => {
    setEditIdx(row.index);
    setName(row.name);
    setPorts(row.ports || []);
    setEnv(row.env || []);
    setCommand(row.command || []);
    setArgs(row.args || []);
    setResources(row.resources || { requests: {}, limits: {} });
  };

  const handleCancel = () => {
    setEditIdx(null);
    setName("");
    setPorts([]);
    setEnv([]);
    setCommand([]);
    setArgs([]);
    setResources({ requests: {}, limits: {} });
  };

  // Port handlers
  const handleAddOrUpdatePort = () => {
    if (!portNumber || !targetPort) return;
    const portObj = { port: Number(portNumber), target_port: Number(targetPort), protocol: portProtocol };
    if (portEditIdx !== null) {
      setPorts(ports.map((p, i) => (i === portEditIdx ? portObj : p)));
      setPortEditIdx(null);
    } else {
      setPorts([...ports, portObj]);
    }
    setPortNumber("");
    setTargetPort("");
    setPortProtocol("TCP");
  };
  const handleEditPort = (row: any) => {
    setPortNumber(row.port.toString());
    setTargetPort(row.target_port.toString());
    setPortProtocol(row.protocol || "TCP");
    setPortEditIdx(row.index);
  };
  const handleCancelPort = () => {
    setPortNumber("");
    setTargetPort("");
    setPortProtocol("TCP");
    setPortEditIdx(null);
  };

  // Env handlers
  const handleAddOrUpdateEnv = () => {
    if (!envName || !envValue) return;
    const envObj = { name: envName, value: envValue };
    if (envEditIdx !== null) {
      setEnv(env.map((e, i) => (i === envEditIdx ? envObj : e)));
      setEnvEditIdx(null);
    } else {
      setEnv([...env, envObj]);
    }
    setEnvName("");
    setEnvValue("");
  };
  const handleEditEnv = (row: any) => {
    setEnvName(row.name);
    setEnvValue(row.value);
    setEnvEditIdx(row.index);
  };
  const handleCancelEnv = () => {
    setEnvName("");
    setEnvValue("");
    setEnvEditIdx(null);
  };

  // Command handlers
  const handleAddOrUpdateCommand = () => {
    if (!commandInput) return;
    if (commandEditIdx !== null) {
      setCommand(command.map((c, i) => (i === commandEditIdx ? commandInput : c)));
      setCommandEditIdx(null);
    } else {
      setCommand([...command, commandInput]);
    }
    setCommandInput("");
  };
  const handleEditCommand = (row: any) => {
    setCommandInput(row.value);
    setCommandEditIdx(row.index);
  };
  const handleCancelCommand = () => {
    setCommandInput("");
    setCommandEditIdx(null);
  };

  // Args handlers
  const handleAddOrUpdateArgs = () => {
    if (!argsInput) return;
    if (argsEditIdx !== null) {
      setArgs(args.map((a, i) => (i === argsEditIdx ? argsInput : a)));
      setArgsEditIdx(null);
    } else {
      setArgs([...args, argsInput]);
    }
    setArgsInput("");
  };
  const handleEditArgs = (row: any) => {
    setArgsInput(row.value);
    setArgsEditIdx(row.index);
  };
  const handleCancelArgs = () => {
    setArgsInput("");
    setArgsEditIdx(null);
  };

  // Resource handlers
  const handleAddResource = () => {
    if (!resourceKey.trim() || !resourceValue.trim()) return;
    setResources(prev => {
      const updated = { ...prev };
      if (resourceType === "requests") {
        updated.requests = { ...updated.requests, [resourceKey]: resourceValue };
      } else {
        updated.limits = { ...updated.limits, [resourceKey]: resourceValue };
      }
      return updated;
    });
    setResourceKey("");
    setResourceValue("");
    setResourceEditKey(null);
  };
  const handleEditResource = (row: any) => {
    setResourceType(row.type === "Request" ? "requests" : "limits");
    setResourceKey(row.key);
    setResourceValue(row.value);
    setResourceEditKey(row.key);
  };
  const handleCancelResource = () => {
    setResourceKey("");
    setResourceValue("");
    setResourceEditKey(null);
  };

  return (
    <div className="space-y-8">
      {/* Container List Popover */}
      <div>
        <div className="flex flex-col items-start justify-between mb-2">
          <FormLabel>Containers</FormLabel>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                <FormDescription className="mt-2">
                  {containers.length > 0
                    ? `${containers.length} container${containers.length === 1 ? "" : "s"} configured`
                    : "Add container configuration"}
                </FormDescription>
                {containers.length > 0 && <ChevronDown className="w-4 h-4" />}
              </div>
            </PopoverTrigger>
            <PopoverContent className="!w-[40rem] p-0 border-none shadow-none" align="start">
              <ResourceTable
                columns={[
                  { header: "Name", accessor: "name" }
                ]}
                data={containers.map((c: any, idx: number) => ({ ...c, index: idx }))}
                onEdit={handleEdit}
                onDelete={(row: any) => remove(row.index)}
                className="p-2 border-[0.5px] border-gray-200 shadow-none"
                tableClassName="max-h-[300px]"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Container Configuration Form */}
      <div className="border rounded p-4 bg-white space-y-6">
        <h3 className="font-medium">Container Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormLabel>Container Name</FormLabel>
            <Input placeholder="Container Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>
        {/* Ports */}
        <div>
          <div className="flex flex-col items-start justify-between mb-2">
            <FormLabel>Ports</FormLabel>
            <Popover open={isPortsPopoverOpen} onOpenChange={setIsPortsPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                  <FormDescription className="mt-2">
                    {ports.length > 0
                      ? `${ports.length} port${ports.length === 1 ? "" : "s"} configured`
                      : "Add Port configuration"}
                  </FormDescription>
                  {ports.length > 0 && <ChevronDown className="w-4 h-4" />}
                </div>
              </PopoverTrigger>
              <PopoverContent className="!w-[40rem] p-0 border-none shadow-none" align="start">
                <ResourceTable
                  columns={[
                    { header: "Port", accessor: "port" },
                    { header: "Target Port", accessor: "target_port" },
                    { header: "Protocol", accessor: "protocol" }
                  ]}
                  data={ports.map((p, idx) => ({ ...p, index: idx }))}
                  onEdit={handleEditPort}
                  onDelete={(row: any) => setPorts(ports.filter((_, i) => i !== row.index))}
                  className="p-2 border-[0.5px] border-gray-200 shadow-none"
                  tableClassName="max-h-[300px]"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 mb-2">
            <Input placeholder="Port" type="number" value={portNumber} onChange={e => setPortNumber(e.target.value)} />
            <Input placeholder="Target Port" type="number" value={targetPort} onChange={e => setTargetPort(e.target.value)} />
            <Input placeholder="Protocol" value={portProtocol} onChange={e => setPortProtocol(e.target.value)} />
            {portEditIdx !== null && (
              <Button type="button" variant="outline" onClick={handleCancelPort}>
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                <span>Cancel</span>
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleAddOrUpdatePort} disabled={!portNumber || !targetPort}>
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{portEditIdx !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>
        {/* Env */}
        <div>
          <div className="flex flex-col items-start justify-between mb-2">
            <FormLabel>Environment Variables</FormLabel>
            <Popover open={isEnvPopoverOpen} onOpenChange={setIsEnvPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                  <FormDescription className="mt-2">
                    {env.length > 0
                      ? `${env.length} env variable${env.length === 1 ? "" : "s"} configured`
                      : "Add Environment variables"}
                  </FormDescription>
                  {env.length > 0 && <ChevronDown className="w-4 h-4" />}
                </div>
              </PopoverTrigger>
              <PopoverContent className="!w-[40rem] p-0 border-none shadow-none" align="start">
                <ResourceTable
                  columns={[{ header: "Name", accessor: "name" }, { header: "Value", accessor: "value" }]}
                  data={env.map((e, idx) => ({ ...e, index: idx }))}
                  onEdit={handleEditEnv}
                  onDelete={(row: any) => setEnv(env.filter((_, i) => i !== row.index))}
                  className="p-2 border-[0.5px] border-gray-200 shadow-none"
                  tableClassName="max-h-[300px]"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 mb-2">
            <Input placeholder="Name" value={envName} onChange={e => setEnvName(e.target.value)} />
            <Input placeholder="Value" value={envValue} onChange={e => setEnvValue(e.target.value)} />
            {envEditIdx !== null && (
              <Button type="button" variant="outline" onClick={handleCancelEnv}>
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                <span>Cancel</span>
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleAddOrUpdateEnv} disabled={!envName || !envValue}>
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{envEditIdx !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>
        {/* Command */}
        <div>
          <div className="flex flex-col items-start justify-between mb-2">
            <FormLabel>Command</FormLabel>
            <Popover open={isCommandPopoverOpen} onOpenChange={setIsCommandPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                  <FormDescription className="mt-2">
                    {command.length > 0
                      ? `${command.length} command argument${command.length === 1 ? "" : "s"} configured`
                      : "Add Command arguments"}
                  </FormDescription>
                  {command.length > 0 && <ChevronDown className="w-4 h-4" />}
                </div>
              </PopoverTrigger>
              <PopoverContent className="!w-[40rem] p-0 border-none shadow-none" align="start">
                <ResourceTable
                  columns={[{ header: "Command", accessor: "value" }]}
                  data={command.map((c, idx) => ({ value: c, index: idx }))}
                  onEdit={handleEditCommand}
                  onDelete={(row: any) => setCommand(command.filter((_, i) => i !== row.index))}
                  className="p-2 border-[0.5px] border-gray-200 shadow-none"
                  tableClassName="max-h-[300px]"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 mb-2">
            <Input placeholder="Command argument" value={commandInput} onChange={e => setCommandInput(e.target.value)} />
            {commandEditIdx !== null && (
              <Button type="button" variant="outline" onClick={handleCancelCommand}>
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                <span>Cancel</span>
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleAddOrUpdateCommand} disabled={!commandInput}>
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{commandEditIdx !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>
        {/* Args */}
        <div>
          <div className="flex flex-col items-start justify-between mb-2">
            <FormLabel>Args</FormLabel>
            <Popover open={isArgsPopoverOpen} onOpenChange={setIsArgsPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                  <FormDescription className="mt-2">
                    {args.length > 0
                      ? `${args.length} argument${args.length === 1 ? "" : "s"} configured`
                      : "Add Arguments"}
                  </FormDescription>
                  {args.length > 0 && <ChevronDown className="w-4 h-4" />}
                </div>
              </PopoverTrigger>
              <PopoverContent className="!w-[40rem] p-0 border-none shadow-none" align="start">
                <ResourceTable
                  columns={[{ header: "Argument", accessor: "value" }]}
                  data={args.map((a, idx) => ({ value: a, index: idx }))}
                  onEdit={handleEditArgs}
                  onDelete={(row: any) => setArgs(args.filter((_, i) => i !== row.index))}
                  className="p-2 border-[0.5px] border-gray-200 shadow-none"
                  tableClassName="max-h-[300px]"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 mb-2">
            <Input placeholder="Argument value" value={argsInput} onChange={e => setArgsInput(e.target.value)} />
            {argsEditIdx !== null && (
              <Button type="button" variant="outline" onClick={handleCancelArgs}>
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                <span>Cancel</span>
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleAddOrUpdateArgs} disabled={!argsInput}>
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{argsEditIdx !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>
        {/* Resources */}
        <div>
          <div className="flex flex-col items-start justify-between mb-2">
            <FormLabel>Resources</FormLabel>
            <Popover open={isResourcesPopoverOpen} onOpenChange={setIsResourcesPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                  <FormDescription className="mt-2">
                    {Object.keys(resources.requests).length + Object.keys(resources.limits).length > 0
                      ? `${Object.keys(resources.requests).length + Object.keys(resources.limits).length} resource${Object.keys(resources.requests).length + Object.keys(resources.limits).length === 1 ? "" : "s"} configured`
                      : "Add Resource configuration"}
                  </FormDescription>
                  {Object.keys(resources.requests).length + Object.keys(resources.limits).length > 0 && <ChevronDown className="w-4 h-4" />}
                </div>
              </PopoverTrigger>
              <PopoverContent className="!w-[48rem] p-0 border-none shadow-none" align="start">
                <ResourceTable
                  columns={[
                    { header: "Type", accessor: "type" },
                    { header: "Resource", accessor: "key" },
                    { header: "Value", accessor: "value" }
                  ]}
                  data={[
                    ...Object.entries(resources.requests).map(([key, value]) => ({ type: "Request", key, value })),
                    ...Object.entries(resources.limits).map(([key, value]) => ({ type: "Limit", key, value }))
                  ].map((r, idx) => ({ ...r, index: idx }))}
                  onEdit={handleEditResource}
                  onDelete={(row: any) => {
                    const newResources = { ...resources };
                    if (row.type === "Request") {
                      delete newResources.requests[row.key];
                    } else {
                      delete newResources.limits[row.key];
                    }
                    setResources(newResources);
                  }}
                  className="p-2 border-[0.5px] border-gray-200 shadow-none"
                  tableClassName="max-h-[300px]"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 mb-2">
            <select value={resourceType} onChange={e => setResourceType(e.target.value as "requests" | "limits")} className="border rounded px-3 py-2">
              <option value="requests">Requests</option>
              <option value="limits">Limits</option>
            </select>
            <Input placeholder="Resource (e.g., cpu, memory)" value={resourceKey} onChange={e => setResourceKey(e.target.value)} />
            <Input placeholder="Value (e.g., 100m, 128Mi)" value={resourceValue} onChange={e => setResourceValue(e.target.value)} />
            {resourceEditKey !== null && (
              <Button type="button" variant="outline" onClick={handleCancelResource}>
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                <span>Cancel</span>
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleAddResource} disabled={!resourceKey.trim() || !resourceValue.trim()}>
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{resourceEditKey !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>
        {/* Container Add/Update Button */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          {editIdx !== null && (
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 text-red-500 hover:text-red-600" />
              <span>Cancel</span>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleAddOrUpdate} disabled={!name}>
            <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
            <span>{editIdx !== null ? "Update Container" : "Add Container"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContainersSection; 