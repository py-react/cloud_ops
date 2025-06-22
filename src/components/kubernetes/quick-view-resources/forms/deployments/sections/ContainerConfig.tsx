import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { X, Check, ChevronDown } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { SectionProps } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResourceTable } from "@/components/kubernetes/resources/resourceTable";

export function ContainerConfig({ control }: SectionProps) {
  // Helper to indicate required fields
  const RequiredBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-red-50 px-1 py-0.5 text-xs font-medium text-red-700">
      Required
    </span>
  );

  // Helper to indicate optional fields
  const OptionalBadge = () => (
    <span className="inline-flex ml-1 items-center rounded-[0.5rem] bg-gray-50 px-1 py-0.5 text-xs font-medium text-gray-600">
      Optional
    </span>
  );

  // Containers array
  const { fields: containerFields, append, remove, update } = useFieldArray({
    control,
    name: "spec.template.spec.containers"
  });
  
  // Container configuration state
  const [containerName, setContainerName] = useState("");
  const [containerImage, setContainerImage] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isContainerPopoverOpen, setIsContainerPopoverOpen] = useState(false);

  // Container sub-arrays
  const [ports, setPorts] = useState<{ name: string, containerPort: number, protocol: string }[]>([]);
  const [portName, setPortName] = useState("");
  const [portNumber, setPortNumber] = useState("");
  const [portProtocol, setPortProtocol] = useState("TCP");
  const [portEditIdx, setPortEditIdx] = useState<number | null>(null);
  const [isPortsPopoverOpen, setIsPortsPopoverOpen] = useState(false);

  const [env, setEnv] = useState<{ name: string, value: string }[]>([]);
  const [envName, setEnvName] = useState("");
  const [envValue, setEnvValue] = useState("");
  const [envEditIdx, setEnvEditIdx] = useState<number | null>(null);
  const [isEnvPopoverOpen, setIsEnvPopoverOpen] = useState(false);

  const [resources, setResources] = useState<{ requests: Record<string, string>, limits: Record<string, string> }>({ requests: {}, limits: {} });
  const [resourceType, setResourceType] = useState<"requests" | "limits">("requests");
  const [resourceKey, setResourceKey] = useState("");
  const [resourceValue, setResourceValue] = useState("");
  const [resourceEditKey, setResourceEditKey] = useState<string | null>(null);
  const [isResourcesPopoverOpen, setIsResourcesPopoverOpen] = useState(false);

  const [command, setCommand] = useState<string[]>([]);
  const [commandInput, setCommandInput] = useState("");
  const [commandEditIdx, setCommandEditIdx] = useState<number | null>(null);
  const [isCommandPopoverOpen, setIsCommandPopoverOpen] = useState(false);

  const [args, setArgs] = useState<string[]>([]);
  const [argsInput, setArgsInput] = useState("");
  const [argsEditIdx, setArgsEditIdx] = useState<number | null>(null);
  const [isArgsPopoverOpen, setIsArgsPopoverOpen] = useState(false);

  // Add/Edit container
  const handleSaveContainer = () => {
    const container = {
      name: containerName,
      image: containerImage,
      ports: ports.length > 0 ? ports : undefined,
      env: env.length > 0 ? env : undefined,
      resources: Object.keys(resources.requests).length > 0 || Object.keys(resources.limits).length > 0 ? resources : undefined,
      command: command.length > 0 ? command : undefined,
      args: args.length > 0 ? args : undefined
    };
    
    if (editingIndex !== null) {
      update(editingIndex, container);
    } else {
      append(container);
    }
    handleResetContainer();
  };

  const handleEditContainer = (row: any) => {
    setContainerName(row.name);
    setContainerImage(row.image);
    setPorts(row.ports || []);
    setEnv(row.env || []);
    setResources(row.resources || { requests: {}, limits: {} });
    setCommand(row.command || []);
    setArgs(row.args || []);
    setEditingIndex(row.index);
  };

  const handleResetContainer = () => {
    setContainerName("");
    setContainerImage("");
    setPorts([]);
    setEnv([]);
    setResources({ requests: {}, limits: {} });
    setCommand([]);
    setArgs([]);
    setEditingIndex(null);
  };

  // Add/Edit ports
  const handleAddPort = () => {
    if (!portNumber.trim()) return;
    const newPort = { name: portName, containerPort: parseInt(portNumber), protocol: portProtocol };
    if (portEditIdx !== null) {
      setPorts(ports.map((p, i) => i === portEditIdx ? newPort : p));
      setPortEditIdx(null);
    } else {
      setPorts([...ports, newPort]);
    }
    setPortName("");
    setPortNumber("");
    setPortProtocol("TCP");
  };

  const handleEditPort = (row: any) => {
    setPortName(row.name || "");
    setPortNumber(row.containerPort.toString());
    setPortProtocol(row.protocol || "TCP");
    setPortEditIdx(row.index);
  };

  const handleCancelPort = () => {
    setPortName("");
    setPortNumber("");
    setPortProtocol("TCP");
    setPortEditIdx(null);
  };

  // Add/Edit env
  const handleAddEnv = () => {
    if (!envName.trim() || !envValue.trim()) return;
    if (envEditIdx !== null) {
      setEnv(env.map((e, i) => i === envEditIdx ? { name: envName, value: envValue } : e));
      setEnvEditIdx(null);
    } else {
      setEnv([...env, { name: envName, value: envValue }]);
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

  // Add/Edit resources
  const handleAddResource = () => {
    if (!resourceKey.trim() || !resourceValue.trim()) return;
    const newResources = { ...resources };
    if (resourceEditKey) {
      delete newResources[resourceType][resourceEditKey];
    }
    newResources[resourceType][resourceKey] = resourceValue;
    setResources(newResources);
    setResourceKey("");
    setResourceValue("");
    setResourceEditKey(null);
  };

  const handleEditResource = (row: any) => {
    setResourceKey(row.key);
    setResourceValue(row.value);
    setResourceType(row.type);
    setResourceEditKey(row.key);
  };

  const handleCancelResource = () => {
    setResourceKey("");
    setResourceValue("");
    setResourceEditKey(null);
  };

  // Add/Edit command
  const handleAddCommand = () => {
    if (!commandInput.trim()) return;
    if (commandEditIdx !== null) {
      setCommand(command.map((c, i) => i === commandEditIdx ? commandInput : c));
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

  // Add/Edit args
  const handleAddArgs = () => {
    if (!argsInput.trim()) return;
    if (argsEditIdx !== null) {
      setArgs(args.map((a, i) => i === argsEditIdx ? argsInput : a));
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

  return (
    <div className="space-y-8">
      {/* Container List Popover */}
      <div>
        <div className="flex flex-col items-start justify-between mb-2">
          <FormLabel>Containers</FormLabel>
          <Popover open={isContainerPopoverOpen} onOpenChange={setIsContainerPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground w-full">
                <FormDescription className="mt-2">
                  {containerFields.filter((c: any) => c.name && c.image).length > 0
                    ? `${containerFields.filter((c: any) => c.name && c.image).length} container${containerFields.filter((c: any) => c.name && c.image).length === 1 ? "" : "s"} configured`
                    : "Add Container details"}
                </FormDescription>
                {containerFields.filter((c: any) => c.name && c.image).length > 0 && <ChevronDown className="w-4 h-4" />}
              </div>
            </PopoverTrigger>
            <PopoverContent className="!w-[48rem] p-0 border-none shadow-none" align="start">
              <ResourceTable
                columns={[{ header: "Name", accessor: "name" }, { header: "Image", accessor: "image" }]}
                data={containerFields
                  .filter((c: any) => c.name && c.image) // Only show containers with both name and image
                  .map((c, idx) => ({ ...c, index: idx }))}
                onEdit={handleEditContainer}
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
        
        {/* Container Name and Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormLabel>
              Container Name <RequiredBadge />
            </FormLabel>
            <FormDescription className=" mt-1 mb-2">
              The name of the container
            </FormDescription>
            <Input placeholder="Container Name" value={containerName} onChange={e => setContainerName(e.target.value)} />
          </div>
          
          <div>
            <FormLabel>
              Container Image <RequiredBadge />
            </FormLabel>
            <FormDescription className=" mt-1 mb-2">
              The container image to use
            </FormDescription>
            <Input placeholder="Container Image" value={containerImage} onChange={e => setContainerImage(e.target.value)} />
          </div>
        </div>

        {/* Ports */}
        <div>
          <div className="flex flex-col items-start justify-between mb-2">
            <FormLabel>
              Ports <OptionalBadge />
            </FormLabel>
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
              <PopoverContent className="!w-[48rem] p-0 border-none shadow-none" align="start">
                <ResourceTable
                  columns={[
                    { header: "Name", accessor: "name" },
                    { header: "Port", accessor: "containerPort" },
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
            <Input placeholder="Name (optional)" value={portName} onChange={e => setPortName(e.target.value)} />
            <Input placeholder="Port" type="number" value={portNumber} onChange={e => setPortNumber(e.target.value)} />
            <Input placeholder="Protocol" value={portProtocol} onChange={e => setPortProtocol(e.target.value)} />
            {portEditIdx !== null && (
              <Button type="button" variant="outline" onClick={handleCancelPort}>
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                <span>Cancel</span>
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleAddPort} disabled={!portNumber.trim()}>
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{portEditIdx !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>

        {/* Environment Variables */}
        <div>
          <div className="flex flex-col items-start justify-between mb-2">
            <FormLabel>
              Environment Variables <OptionalBadge />
            </FormLabel>
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
              <PopoverContent className="!w-[48rem] p-0 border-none shadow-none" align="start">
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
            <Button type="button" variant="outline" onClick={handleAddEnv} disabled={!envName.trim() || !envValue.trim()}>
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{envEditIdx !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>

        {/* Resources */}
        <div>
          <div className="flex flex-col items-start justify-between mb-2">
            <FormLabel>
              Resources <OptionalBadge />
            </FormLabel>
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

        {/* Command */}
        <div>
          <div className="flex flex-col items-start justify-between mb-2">
            <FormLabel>
              Command <OptionalBadge />
            </FormLabel>
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
              <PopoverContent className="!w-[48rem] p-0 border-none shadow-none" align="start">
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
            <Button type="button" variant="outline" onClick={handleAddCommand} disabled={!commandInput.trim()}>
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{commandEditIdx !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>

        {/* Args */}
        <div>
          <div className="flex flex-col items-start justify-between mb-2">
            <FormLabel>
              Args <OptionalBadge />
            </FormLabel>
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
              <PopoverContent className="!w-[48rem] p-0 border-none shadow-none" align="start">
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
            <Button type="button" variant="outline" onClick={handleAddArgs} disabled={!argsInput.trim()}>
              <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              <span>{argsEditIdx !== null ? "Update" : "Add"}</span>
            </Button>
          </div>
        </div>

        {/* Container Add/Update Button */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          {editingIndex !== null && (
            <Button type="button" variant="outline" onClick={handleResetContainer}>
              <X className="w-4 h-4 text-red-500 hover:text-red-600" />
              <span>Cancel</span>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleSaveContainer} disabled={!containerName.trim() || !containerImage.trim()}>
            <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
            <span>{editingIndex !== null ? "Update Container" : "Add Container"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 