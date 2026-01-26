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
import { Plus, Trash2, HardDrive } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { DeploymentFormData, getVolumeType, updateVolumeType } from "./formUtils";
import {
  K8sVolume,
  K8sEmptyDirVolume,
  K8sConfigMapVolume,
  K8sSecretVolume,
  K8sPersistentVolumeClaimVolume
} from "../type";

interface VolumesProps {
  form: UseFormReturn<DeploymentFormData>;
}

const Volumes: React.FC<VolumesProps> = ({ form }) => {
  const formData = form.watch();

  const addVolume = () => {
    const currentVolumes = form.getValues("volumes") || [];
    form.setValue("volumes", [
      ...currentVolumes,
      { name: "", emptyDir: {} },
    ]);
  };

  const removeVolume = (index: number) => {
    const currentVolumes = form.getValues("volumes") || [];
    form.setValue(
      "volumes",
      currentVolumes.filter((_, i) => i !== index)
    );
  };

  return (
    <Card className="p-4 shadow-none border">
      <CardHeader>
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-slate-600" />
          Volumes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(formData.volumes || []).map((volume, index) => {
          const volumeType = getVolumeType(volume);
          return (
            <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Volume {index + 1}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeVolume(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Volume Name</Label>
                  <Input
                    {...form.register(`volumes.${index}.name` as const)}
                    placeholder="volume-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Volume Type</Label>
                  <Select
                    value={volumeType}
                    onValueChange={(value) => updateVolumeType(form, index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emptyDir">Empty Directory</SelectItem>
                      <SelectItem value="configMap">ConfigMap</SelectItem>
                      <SelectItem value="secret">Secret</SelectItem>
                      <SelectItem value="persistentVolumeClaim">Persistent Volume Claim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional inputs based on volume type */}
              {volumeType === 'emptyDir' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Medium</Label>
                    <Select
                      value={(volume as K8sEmptyDirVolume).emptyDir?.medium || "default"}
                      onValueChange={(value) => {
                        const newVolumes = [...(formData.volumes || [])];
                        (newVolumes[index] as K8sEmptyDirVolume).emptyDir.medium = value === "default" ? undefined : value;
                        form.setValue("volumes", newVolumes);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medium" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (Disk)</SelectItem>
                        <SelectItem value="Memory">Memory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Size Limit</Label>
                    <Input
                      {...form.register(`volumes.${index}.emptyDir.sizeLimit` as any)}
                      placeholder="e.g., 1Gi, 100Mi"
                    />
                  </div>
                </div>
              )}

              {volumeType === 'configMap' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">ConfigMap Name</Label>
                    <Input
                      {...form.register(`volumes.${index}.configMap.name` as any)}
                      placeholder="configmap-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Default Mode</Label>
                    <Input
                      {...form.register(`volumes.${index}.configMap.defaultMode` as any, { valueAsNumber: true })}
                      placeholder="e.g., 420"
                    />
                  </div>
                </div>
              )}

              {volumeType === 'secret' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Secret Name</Label>
                    <Input
                      value={(volume as K8sSecretVolume).secret?.secretName || ""}
                      onChange={(e) => {
                        const newVolumes = [...(formData.volumes || [])];
                        (newVolumes[index] as K8sSecretVolume).secret.secretName = e.target.value;
                        form.setValue("volumes", newVolumes);
                      }}
                      placeholder="secret-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Default Mode</Label>
                    <Input
                      type="number"
                      value={(volume as K8sSecretVolume).secret?.defaultMode || ""}
                      onChange={(e) => {
                        const newVolumes = [...(formData.volumes || [])];
                        (newVolumes[index] as K8sSecretVolume).secret.defaultMode = parseInt(e.target.value) || undefined;
                        form.setValue("volumes", newVolumes);
                      }}
                      placeholder="e.g., 420"
                    />
                  </div>
                </div>
              )}

              {volumeType === 'persistentVolumeClaim' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Claim Name</Label>
                    <Input
                      value={(volume as K8sPersistentVolumeClaimVolume).persistentVolumeClaim?.claimName || ""}
                      onChange={(e) => {
                        const newVolumes = [...(formData.volumes || [])];
                        (newVolumes[index] as K8sPersistentVolumeClaimVolume).persistentVolumeClaim.claimName = e.target.value;
                        form.setValue("volumes", newVolumes);
                      }}
                      placeholder="pvc-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Read Only</Label>
                    <Select
                      value={(volume as K8sPersistentVolumeClaimVolume).persistentVolumeClaim?.readOnly ? "true" : "false"}
                      onValueChange={(value) => {
                        const newVolumes = [...(formData.volumes || [])];
                        (newVolumes[index] as K8sPersistentVolumeClaimVolume).persistentVolumeClaim.readOnly = value === "true";
                        form.setValue("volumes", newVolumes);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={addVolume}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Volume
        </Button>
      </CardContent>
    </Card>
  );
};

export default Volumes; 