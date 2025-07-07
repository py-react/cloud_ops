import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Container,
  Key,
  Network,
  Cpu,
  HardDrive,
  Settings,
  HelpCircle,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { DeploymentFormData } from "./formUtils";

interface ContainersProps {
  form: UseFormReturn<DeploymentFormData>;
}

const Containers: React.FC<ContainersProps> = ({ form }) => {
  const formData = form.watch();

  const addContainer = () => {
    const currentContainers = form.getValues("containers") || [];
    form.setValue("containers", [
      ...currentContainers,
      {
        name: "",
        command: [],
        args: [],
        env: [],
        ports: [],
        resources: { requests: {}, limits: {} },
      },
    ]);
  };

  const removeContainer = (index: number) => {
    const currentContainers = form.getValues("containers") || [];
    form.setValue(
      "containers",
      currentContainers.filter((_, i) => i !== index)
    );
  };

  const addEnvironmentVariable = (containerIndex: number) => {
    const currentContainers = form.getValues("containers") || [];
    if (currentContainers[containerIndex]) {
      if (!currentContainers[containerIndex].env) {
        currentContainers[containerIndex].env = [];
      }
      currentContainers[containerIndex].env.push({ name: "", value: "" });
      form.setValue("containers", currentContainers);
    }
  };

  const removeEnvironmentVariable = (
    containerIndex: number,
    envIndex: number
  ) => {
    const currentContainers = form.getValues("containers") || [];
    if (currentContainers[containerIndex] && currentContainers[containerIndex].env) {
      currentContainers[containerIndex].env = currentContainers[
        containerIndex
      ].env.filter((_, i) => i !== envIndex);
      form.setValue("containers", currentContainers);
    }
  };

  const addPort = (containerIndex: number) => {
    const currentContainers = form.getValues("containers") || [];
    if (currentContainers[containerIndex]) {
      if (!currentContainers[containerIndex].ports) {
        currentContainers[containerIndex].ports = [];
      }
      currentContainers[containerIndex].ports.push({
        containerPort: 0,
        name: "",
        protocol: "TCP",
      });
      form.setValue("containers", currentContainers);
    }
  };

  const removePort = (containerIndex: number, portIndex: number) => {
    const currentContainers = form.getValues("containers") || [];
    if (currentContainers[containerIndex] && currentContainers[containerIndex].ports) {
      currentContainers[containerIndex].ports = currentContainers[
        containerIndex
      ].ports.filter((_, i) => i !== portIndex);
      form.setValue("containers", currentContainers);
    }
  };

  const addVolumeMount = (containerIndex: number) => {
    const currentContainers = form.getValues("containers") || [];
    if (currentContainers[containerIndex]) {
      if (!currentContainers[containerIndex].volumeMounts) {
        currentContainers[containerIndex].volumeMounts = [];
      }
      currentContainers[containerIndex].volumeMounts.push({
        name: "",
        mountPath: "",
        readOnly: false,
      });
      form.setValue("containers", currentContainers);
    }
  };

  const removeVolumeMount = (containerIndex: number, mountIndex: number) => {
    const currentContainers = form.getValues("containers") || [];
    if (currentContainers[containerIndex] && currentContainers[containerIndex].volumeMounts) {
      currentContainers[containerIndex].volumeMounts = currentContainers[
        containerIndex
      ].volumeMounts.filter((_, i) => i !== mountIndex);
      form.setValue("containers", currentContainers);
    }
  };

  return (
    <Card className="p-4 shadow-none border">
      <CardHeader>
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          <Container className="h-5 w-5 text-slate-600" />
          Containers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {formData.containers.map((container, containerIndex) => (
          <div
            key={containerIndex}
            className="border border-slate-200 rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Container {containerIndex + 1}
                </Badge>
              </div>
              {formData.containers.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeContainer(containerIndex)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Container Name</Label>
                <Input
                  value={container.name}
                  onChange={(e) => {
                    const newContainers = [...formData.containers];
                    newContainers[containerIndex].name = e.target.value;
                    form.setValue("containers", newContainers);
                  }}
                  placeholder="my-app-container"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium">Image Pull Policy</Label>
                <Select
                  value={container.imagePullPolicy || "IfNotPresent"}
                  onValueChange={(value) => {
                    const newContainers = [...formData.containers];
                    newContainers[containerIndex].imagePullPolicy = value as "Always" | "IfNotPresent" | "Never";
                    form.setValue("containers", newContainers);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IfNotPresent">IfNotPresent</SelectItem>
                    <SelectItem value="Always">Always</SelectItem>
                    <SelectItem value="Never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Working Directory</Label>
              <Input
                value={container.workingDir || ""}
                onChange={(e) => {
                  const newContainers = [...formData.containers];
                  newContainers[containerIndex].workingDir = e.target.value;
                  form.setValue("containers", newContainers);
                }}
                placeholder="/app"
              />
            </div>

            {/* Command and Args */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Command (comma-separated)</Label>
                <Input
                  value={container.command?.join(", ") || ""}
                  onChange={(e) => {
                    const newContainers = [...formData.containers];
                    newContainers[containerIndex].command = e.target.value.split(",").map(cmd => cmd.trim()).filter(cmd => cmd);
                    form.setValue("containers", newContainers);
                  }}
                  placeholder="npm, start"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium">Args (comma-separated)</Label>
                <Input
                  value={container.args?.join(", ") || ""}
                  onChange={(e) => {
                    const newContainers = [...formData.containers];
                    newContainers[containerIndex].args = e.target.value.split(",").map(arg => arg.trim()).filter(arg => arg);
                    form.setValue("containers", newContainers);
                  }}
                  placeholder="--env, production"
                />
              </div>
            </div>

            {/* Environment Variables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Environment Variables
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addEnvironmentVariable(containerIndex)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Env Var
                </Button>
              </div>
              {container.env?.map((env, envIndex) => (
                <div key={envIndex} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={env.name}
                      onChange={(e) => {
                        const newContainers = [...formData.containers];
                        if (newContainers[containerIndex]?.env?.[envIndex]) {
                          newContainers[containerIndex].env[envIndex].name =
                            e.target.value;
                          form.setValue("containers", newContainers);
                        }
                      }}
                      placeholder="ENV_NAME"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={env.value}
                      onChange={(e) => {
                        const newContainers = [...formData.containers];
                        if (newContainers[containerIndex]?.env?.[envIndex]) {
                          newContainers[containerIndex].env[
                            envIndex
                          ].value = e.target.value;
                          form.setValue("containers", newContainers);
                        }
                      }}
                      placeholder="value"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      removeEnvironmentVariable(containerIndex, envIndex)
                    }
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Ports */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Container Ports
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addPort(containerIndex)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Port
                </Button>
              </div>
              {container.ports?.map((port, portIndex) => (
                <div key={portIndex} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Input
                      type="number"
                      value={port.containerPort}
                      onChange={(e) => {
                        const newContainers = [...formData.containers];
                        if (newContainers[containerIndex]?.ports?.[portIndex]) {
                          newContainers[containerIndex].ports[
                            portIndex
                          ].containerPort = parseInt(e.target.value) || 0;
                          form.setValue("containers", newContainers);
                        }
                      }}
                      placeholder="Port"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={port.name || ""}
                      onChange={(e) => {
                        const newContainers = [...formData.containers];
                        if (newContainers[containerIndex]?.ports?.[portIndex]) {
                          newContainers[containerIndex].ports[
                            portIndex
                          ].name = e.target.value;
                          form.setValue("containers", newContainers);
                        }
                      }}
                      placeholder="Name"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Select
                      value={port.protocol}
                      onValueChange={(value: "TCP" | "UDP") => {
                        const newContainers = [...formData.containers];
                        if (newContainers[containerIndex]?.ports?.[portIndex]) {
                          newContainers[containerIndex].ports[
                            portIndex
                          ].protocol = value;
                          form.setValue("containers", newContainers);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TCP">TCP</SelectItem>
                        <SelectItem value="UDP">UDP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePort(containerIndex, portIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Resources
                </Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium text-slate-900">Requests</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-base font-medium">CPU</Label>
                        <Input
                          value={container.resources?.requests?.cpu || ""}
                          onChange={(e) => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex].resources) {
                              newContainers[containerIndex].resources = { requests: {}, limits: {} };
                            }
                            if (!newContainers[containerIndex].resources.requests) {
                              newContainers[containerIndex].resources.requests = {};
                            }
                            newContainers[containerIndex].resources.requests.cpu = e.target.value;
                            form.setValue("containers", newContainers);
                          }}
                          placeholder="100m"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-base font-medium">Memory</Label>
                        <Input
                          value={container.resources?.requests?.memory || ""}
                          onChange={(e) => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex].resources) {
                              newContainers[containerIndex].resources = { requests: {}, limits: {} };
                            }
                            if (!newContainers[containerIndex].resources.requests) {
                              newContainers[containerIndex].resources.requests = {};
                            }
                            newContainers[containerIndex].resources.requests.memory = e.target.value;
                            form.setValue("containers", newContainers);
                          }}
                          placeholder="128Mi"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-medium text-slate-900">Limits</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-base font-medium">CPU</Label>
                        <Input
                          value={container.resources?.limits?.cpu || ""}
                          onChange={(e) => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex].resources) {
                              newContainers[containerIndex].resources = { requests: {}, limits: {} };
                            }
                            if (!newContainers[containerIndex].resources.limits) {
                              newContainers[containerIndex].resources.limits = {};
                            }
                            newContainers[containerIndex].resources.limits.cpu = e.target.value;
                            form.setValue("containers", newContainers);
                          }}
                          placeholder="500m"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-base font-medium">Memory</Label>
                        <Input
                          value={container.resources?.limits?.memory || ""}
                          onChange={(e) => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex].resources) {
                              newContainers[containerIndex].resources = { requests: {}, limits: {} };
                            }
                            if (!newContainers[containerIndex].resources.limits) {
                              newContainers[containerIndex].resources.limits = {};
                            }
                            newContainers[containerIndex].resources.limits.memory = e.target.value;
                            form.setValue("containers", newContainers);
                          }}
                          placeholder="512Mi"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Mounts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Volume Mounts
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addVolumeMount(containerIndex)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Mount
                </Button>
              </div>
              {container.volumeMounts?.map((mount, mountIndex) => (
                <div key={mountIndex} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={mount.name}
                      onChange={(e) => {
                        const newContainers = [...formData.containers];
                        if (newContainers[containerIndex]?.volumeMounts?.[mountIndex]) {
                          newContainers[containerIndex].volumeMounts[mountIndex].name = e.target.value;
                          form.setValue("containers", newContainers);
                        }
                      }}
                      placeholder="Volume name"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={mount.mountPath}
                      onChange={(e) => {
                        const newContainers = [...formData.containers];
                        if (newContainers[containerIndex]?.volumeMounts?.[mountIndex]) {
                          newContainers[containerIndex].volumeMounts[mountIndex].mountPath = e.target.value;
                          form.setValue("containers", newContainers);
                        }
                      }}
                      placeholder="Mount path"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`readonly-${containerIndex}-${mountIndex}`}
                        checked={mount.readOnly || false}
                        onChange={(e) => {
                          const newContainers = [...formData.containers];
                          if (newContainers[containerIndex]?.volumeMounts?.[mountIndex]) {
                            newContainers[containerIndex].volumeMounts[mountIndex].readOnly = e.target.checked;
                            form.setValue("containers", newContainers);
                          }
                        }}
                      />
                      <Label htmlFor={`readonly-${containerIndex}-${mountIndex}`} className="text-xs">Read Only</Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeVolumeMount(containerIndex, mountIndex)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Advanced Settings */}
            <div className="mt-4 space-y-8">
              {/* envFrom */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  envFrom
                </Label>
                {(container.envFrom || []).map((envFrom, envFromIndex) => {
                  const envFromType = envFrom.configMapRef ? "configMap" : envFrom.secretRef ? "secret" : "configMap";
                  return (
                    <div key={envFromIndex} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label className="text-base font-medium">Type</Label>
                        <Select
                          value={envFromType}
                          onValueChange={(value) => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex].envFrom) newContainers[containerIndex].envFrom = [];
                            if (!newContainers[containerIndex].envFrom[envFromIndex]) newContainers[containerIndex].envFrom[envFromIndex] = {};
                            
                            // Clear existing refs
                            delete newContainers[containerIndex].envFrom[envFromIndex].configMapRef;
                            delete newContainers[containerIndex].envFrom[envFromIndex].secretRef;
                            
                            // Set new ref based on selection
                            if (value === "configMap") {
                              newContainers[containerIndex].envFrom[envFromIndex].configMapRef = { name: "" };
                            } else if (value === "secret") {
                              newContainers[containerIndex].envFrom[envFromIndex].secretRef = { name: "" };
                            }
                            
                            form.setValue("containers", newContainers);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="configMap">ConfigMap</SelectItem>
                            <SelectItem value="secret">Secret</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label className="text-base font-medium">Name</Label>
                        <Input
                          value={envFrom.configMapRef?.name || envFrom.secretRef?.name || ""}
                          onChange={e => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex].envFrom) newContainers[containerIndex].envFrom = [];
                            if (!newContainers[containerIndex].envFrom[envFromIndex]) newContainers[containerIndex].envFrom[envFromIndex] = {};
                            
                            if (envFromType === "configMap") {
                              if (!newContainers[containerIndex].envFrom[envFromIndex].configMapRef) newContainers[containerIndex].envFrom[envFromIndex].configMapRef = { name: "" };
                              newContainers[containerIndex].envFrom[envFromIndex].configMapRef.name = e.target.value;
                            } else if (envFromType === "secret") {
                              if (!newContainers[containerIndex].envFrom[envFromIndex].secretRef) newContainers[containerIndex].envFrom[envFromIndex].secretRef = { name: "" };
                              newContainers[containerIndex].envFrom[envFromIndex].secretRef.name = e.target.value;
                            }
                            
                            form.setValue("containers", newContainers);
                          }}
                          placeholder={envFromType === "configMap" ? "ConfigMap name" : "Secret name"}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label className="text-base font-medium">Prefix (Optional)</Label>
                        <Input
                          value={envFrom.prefix || ""}
                          onChange={e => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex].envFrom) newContainers[containerIndex].envFrom = [];
                            if (!newContainers[containerIndex].envFrom[envFromIndex]) newContainers[containerIndex].envFrom[envFromIndex] = {};
                            newContainers[containerIndex].envFrom[envFromIndex].prefix = e.target.value;
                            form.setValue("containers", newContainers);
                          }}
                          placeholder="Prefix"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newContainers = [...formData.containers];
                          newContainers[containerIndex].envFrom = (newContainers[containerIndex].envFrom || []).filter((_, i) => i !== envFromIndex);
                          form.setValue("containers", newContainers);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newContainers = [...formData.containers];
                    if (!newContainers[containerIndex].envFrom) newContainers[containerIndex].envFrom = [];
                    newContainers[containerIndex].envFrom.push({ configMapRef: { name: "" }, prefix: "" });
                    form.setValue("containers", newContainers);
                  }}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add envFrom
                </Button>
              </div>

              {/* Probes */}
              {([
                { key: "livenessProbe", label: "Liveness Probe" },
                { key: "readinessProbe", label: "Readiness Probe" },
                { key: "startupProbe", label: "Startup Probe" },
              ] as const).map(({ key, label }) => {
                const probe = container[key];
                let probeType: "exec" | "httpGet" | "tcpSocket" = "httpGet";
                if (probe?.exec) probeType = "exec";
                else if (probe?.tcpSocket) probeType = "tcpSocket";
                else if (probe?.httpGet) probeType = "httpGet";

                return (
                  <div className="space-y-3" key={key}>
                    <Label className="text-base font-medium flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      {label}
                    </Label>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label className="text-base font-medium">Type</Label>
                        <Select
                          value={probeType}
                          onValueChange={value => {
                            const newContainers = [...formData.containers];
                            if (value === "exec") {
                              newContainers[containerIndex][key] = { exec: { command: [] } };
                            } else if (value === "httpGet") {
                              newContainers[containerIndex][key] = { httpGet: { path: "", port: "" } };
                            } else if (value === "tcpSocket") {
                              newContainers[containerIndex][key] = { tcpSocket: { port: "" } };
                            }
                            form.setValue("containers", newContainers);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exec">Exec</SelectItem>
                            <SelectItem value="httpGet">HTTP GET</SelectItem>
                            <SelectItem value="tcpSocket">TCP Socket</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Probe type-specific fields */}
                      {probeType === "exec" && (
                        <div className="flex-1 space-y-2">
                          <Label className="text-base font-medium">Command (comma separated)</Label>
                          <Input
                            value={probe?.exec?.command?.join(", ") || ""}
                            onChange={e => {
                              const newContainers = [...formData.containers];
                              if (!newContainers[containerIndex][key] || !('exec' in newContainers[containerIndex][key])) {
                                newContainers[containerIndex][key] = { exec: { command: [] } };
                              }
                              if (newContainers[containerIndex][key].exec) {
                                newContainers[containerIndex][key].exec.command = e.target.value.split(",").map(cmd => cmd.trim()).filter(cmd => cmd);
                              }
                              form.setValue("containers", newContainers);
                            }}
                            placeholder="/bin/sh, -c, echo hello"
                          />
                        </div>
                      )}
                      {probeType === "httpGet" && (
                        <>
                          <div className="flex-1 space-y-2">
                            <Label className="text-base font-medium">Path</Label>
                            <Input
                              value={probe?.httpGet?.path || ""}
                              onChange={e => {
                                const newContainers = [...formData.containers];
                                if (!newContainers[containerIndex][key] || !('httpGet' in newContainers[containerIndex][key])) {
                                  newContainers[containerIndex][key] = { httpGet: { path: "", port: "" } };
                                }
                                if (newContainers[containerIndex][key].httpGet) {
                                  newContainers[containerIndex][key].httpGet.path = e.target.value;
                                }
                                form.setValue("containers", newContainers);
                              }}
                              placeholder="/healthz"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label className="text-base font-medium">Port</Label>
                            <Input
                              value={probe?.httpGet?.port || ""}
                              onChange={e => {
                                const newContainers = [...formData.containers];
                                if (!newContainers[containerIndex][key] || !('httpGet' in newContainers[containerIndex][key])) {
                                  newContainers[containerIndex][key] = { httpGet: { path: "", port: "" } };
                                }
                                if (newContainers[containerIndex][key].httpGet) {
                                  newContainers[containerIndex][key].httpGet.port = e.target.value;
                                }
                                form.setValue("containers", newContainers);
                              }}
                              placeholder="8080"
                            />
                          </div>
                        </>
                      )}
                      {probeType === "tcpSocket" && (
                        <div className="flex-1 space-y-2">
                          <Label className="text-base font-medium">Port</Label>
                          <Input
                            value={probe?.tcpSocket?.port || ""}
                            onChange={e => {
                              const newContainers = [...formData.containers];
                              if (!newContainers[containerIndex][key] || !('tcpSocket' in newContainers[containerIndex][key])) {
                                newContainers[containerIndex][key] = { tcpSocket: { port: "" } };
                              }
                              if (newContainers[containerIndex][key].tcpSocket) {
                                newContainers[containerIndex][key].tcpSocket.port = e.target.value;
                              }
                              form.setValue("containers", newContainers);
                            }}
                            placeholder="8080"
                          />
                        </div>
                      )}
                    </div>
                    {/* Common fields */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Initial Delay (s)</Label>
                        <Input
                          type="number"
                          value={probe?.initialDelaySeconds || ""}
                          onChange={e => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex][key]) {
                              newContainers[containerIndex][key] = { httpGet: { path: "", port: "" } };
                            }
                            newContainers[containerIndex][key].initialDelaySeconds = e.target.value ? parseInt(e.target.value) : undefined;
                            form.setValue("containers", newContainers);
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Period (s)</Label>
                        <Input
                          type="number"
                          value={probe?.periodSeconds || ""}
                          onChange={e => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex][key]) {
                              newContainers[containerIndex][key] = { httpGet: { path: "", port: "" } };
                            }
                            newContainers[containerIndex][key].periodSeconds = e.target.value ? parseInt(e.target.value) : undefined;
                            form.setValue("containers", newContainers);
                          }}
                          placeholder="10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Timeout (s)</Label>
                        <Input
                          type="number"
                          value={probe?.timeoutSeconds || ""}
                          onChange={e => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex][key]) {
                              newContainers[containerIndex][key] = { httpGet: { path: "", port: "" } };
                            }
                            newContainers[containerIndex][key].timeoutSeconds = e.target.value ? parseInt(e.target.value) : undefined;
                            form.setValue("containers", newContainers);
                          }}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Success Threshold</Label>
                        <Input
                          type="number"
                          value={probe?.successThreshold || ""}
                          onChange={e => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex][key]) {
                              newContainers[containerIndex][key] = { httpGet: { path: "", port: "" } };
                            }
                            newContainers[containerIndex][key].successThreshold = e.target.value ? parseInt(e.target.value) : undefined;
                            form.setValue("containers", newContainers);
                          }}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Failure Threshold</Label>
                        <Input
                          type="number"
                          value={probe?.failureThreshold || ""}
                          onChange={e => {
                            const newContainers = [...formData.containers];
                            if (!newContainers[containerIndex][key]) {
                              newContainers[containerIndex][key] = { httpGet: { path: "", port: "" } };
                            }
                            newContainers[containerIndex][key].failureThreshold = e.target.value ? parseInt(e.target.value) : undefined;
                            form.setValue("containers", newContainers);
                          }}
                          placeholder="3"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Lifecycle */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Lifecycle Hooks
                </Label>
                <Input
                  value={container.lifecycle?.postStart?.exec?.command?.join(", ") || ""}
                  onChange={e => {
                    const newContainers = [...formData.containers];
                    if (!newContainers[containerIndex].lifecycle) newContainers[containerIndex].lifecycle = {};
                    if (!newContainers[containerIndex].lifecycle.postStart) newContainers[containerIndex].lifecycle.postStart = {};
                    if (!newContainers[containerIndex].lifecycle.postStart.exec) newContainers[containerIndex].lifecycle.postStart.exec = { command: [] };
                    newContainers[containerIndex].lifecycle.postStart.exec.command = e.target.value.split(",").map(cmd => cmd.trim()).filter(cmd => cmd);
                    form.setValue("containers", newContainers);
                  }}
                  placeholder="postStart command (comma separated)"
                />
                <Input
                  value={container.lifecycle?.preStop?.exec?.command?.join(", ") || ""}
                  onChange={e => {
                    const newContainers = [...formData.containers];
                    if (!newContainers[containerIndex].lifecycle) newContainers[containerIndex].lifecycle = {};
                    if (!newContainers[containerIndex].lifecycle.preStop) newContainers[containerIndex].lifecycle.preStop = {};
                    if (!newContainers[containerIndex].lifecycle.preStop.exec) newContainers[containerIndex].lifecycle.preStop.exec = { command: [] };
                    newContainers[containerIndex].lifecycle.preStop.exec.command = e.target.value.split(",").map(cmd => cmd.trim()).filter(cmd => cmd);
                    form.setValue("containers", newContainers);
                  }}
                  placeholder="preStop command (comma separated)"
                />
              </div>

              {/* Termination Message */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Termination Message Path</Label>
                  <Input
                    value={container.terminationMessagePath || ""}
                    onChange={(e) => {
                      const newContainers = [...formData.containers];
                      newContainers[containerIndex].terminationMessagePath = e.target.value;
                      form.setValue("containers", newContainers);
                    }}
                    placeholder="/dev/termination-log"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Termination Message Policy</Label>
                  <Select
                    value={container.terminationMessagePolicy || "File"}
                    onValueChange={(value) => {
                      const newContainers = [...formData.containers];
                      newContainers[containerIndex].terminationMessagePolicy = value as "File" | "FallbackToLogsOnError";
                      form.setValue("containers", newContainers);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="File">File</SelectItem>
                      <SelectItem value="FallbackToLogsOnError">FallbackToLogsOnError</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Security Context */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Security Context
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">runAsUser</Label>
                    <Input
                      type="number"
                      value={container.securityContext?.runAsUser || ""}
                      onChange={e => {
                        const newContainers = [...formData.containers];
                        if (!newContainers[containerIndex].securityContext) newContainers[containerIndex].securityContext = {};
                        newContainers[containerIndex].securityContext.runAsUser = e.target.value ? parseInt(e.target.value) : undefined;
                        form.setValue("containers", newContainers);
                      }}
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <Label className="text-base font-medium">runAsNonRoot</Label>
                    <Switch
                      checked={container.securityContext?.runAsNonRoot || false}
                      onCheckedChange={checked => {
                        const newContainers = [...formData.containers];
                        if (!newContainers[containerIndex].securityContext) newContainers[containerIndex].securityContext = {};
                        newContainers[containerIndex].securityContext.runAsNonRoot = checked;
                        form.setValue("containers", newContainers);
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <Label className="text-base font-medium">allowPrivilegeEscalation</Label>
                    <Switch
                      checked={container.securityContext?.allowPrivilegeEscalation || false}
                      onCheckedChange={checked => {
                        const newContainers = [...formData.containers];
                        if (!newContainers[containerIndex].securityContext) newContainers[containerIndex].securityContext = {};
                        newContainers[containerIndex].securityContext.allowPrivilegeEscalation = checked;
                        form.setValue("containers", newContainers);
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <Label className="text-base font-medium">privileged</Label>
                    <Switch
                      checked={container.securityContext?.privileged || false}
                      onCheckedChange={checked => {
                        const newContainers = [...formData.containers];
                        if (!newContainers[containerIndex].securityContext) newContainers[containerIndex].securityContext = {};
                        newContainers[containerIndex].securityContext.privileged = checked;
                        form.setValue("containers", newContainers);
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <Label className="text-base font-medium">readOnlyRootFilesystem</Label>
                    <Switch
                      checked={container.securityContext?.readOnlyRootFilesystem || false}
                      onCheckedChange={checked => {
                        const newContainers = [...formData.containers];
                        if (!newContainers[containerIndex].securityContext) newContainers[containerIndex].securityContext = {};
                        newContainers[containerIndex].securityContext.readOnlyRootFilesystem = checked;
                        form.setValue("containers", newContainers);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* stdin, stdinOnce, tty */}
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={container.stdin || false}
                    onCheckedChange={checked => {
                      const newContainers = [...formData.containers];
                      newContainers[containerIndex].stdin = checked;
                      form.setValue("containers", newContainers);
                    }}
                  />
                  <Label className="text-base font-medium">stdin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={container.stdinOnce || false}
                    onCheckedChange={checked => {
                      const newContainers = [...formData.containers];
                      newContainers[containerIndex].stdinOnce = checked;
                      form.setValue("containers", newContainers);
                    }}
                  />
                  <Label className="text-base font-medium">stdinOnce</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={container.tty || false}
                    onCheckedChange={checked => {
                      const newContainers = [...formData.containers];
                      newContainers[containerIndex].tty = checked;
                      form.setValue("containers", newContainers);
                    }}
                  />
                  <Label className="text-base font-medium">tty</Label>
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addContainer}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Container
        </Button>
      </CardContent>
    </Card>
  );
};

export default Containers; 