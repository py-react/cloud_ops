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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import {
  Plus,
  Trash2,
  HelpCircle,
  MapPin,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { K8sAffinity } from "../type";
import {
  DeploymentFormData,
  hasNodeAffinity,
  hasPodAffinity,
  hasPodAntiAffinity,
  updateNodeAffinityTerm,
  updatePodAffinityTerm,
  updatePodAntiAffinityTerm
} from "./formUtils";

interface AffinityProps {
  form: UseFormReturn<DeploymentFormData>;
}

// Reusable components for match expressions and fields
interface MatchExpressionProps {
  expressions: any[];
  onUpdate: (expressions: any[]) => void;
  operators?: string[];
}

const MatchExpressions: React.FC<MatchExpressionProps> = ({
  expressions,
  onUpdate,
  operators = ["In", "NotIn", "Exists", "DoesNotExist", "Gt", "Lt"]
}) => {
  const addExpression = () => {
    onUpdate([...expressions, { key: '', operator: 'In', values: [] }]);
  };

  const updateExpression = (index: number, field: string, value: any) => {
    const newExpressions = [...expressions];
    newExpressions[index] = { ...newExpressions[index], [field]: value };
    onUpdate(newExpressions);
  };

  const removeExpression = (index: number) => {
    onUpdate(expressions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1">
      <Label className="text-base text-slate-500">Match Expressions</Label>
      {expressions.map((expr, exprIndex) => (
        <div key={exprIndex} className="flex gap-2 items-center">
          <Input
            placeholder="Key"
            value={expr.key}
            onChange={(e) => updateExpression(exprIndex, 'key', e.target.value)}
            className="flex-1"
          />
          <Select
            value={expr.operator}
            onValueChange={(value) => updateExpression(exprIndex, 'operator', value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map(op => (
                <SelectItem key={op} value={op}>{op}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Values (comma-separated)"
            value={expr.values?.join(', ') || ''}
            onChange={(e) => updateExpression(exprIndex, 'values', e.target.value.split(',').map(v => v.trim()).filter(v => v))}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => removeExpression(exprIndex)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div>
        <Button
          className="w-full border-dashed mt-2"
          type="button"
          variant="outline"
          onClick={addExpression}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Match Expression
        </Button>
      </div>
    </div>
  );
};

// Reusable component for match labels
interface MatchLabelsProps {
  labels: { [key: string]: string };
  onUpdate: (labels: { [key: string]: string }) => void;
}

const MatchLabels: React.FC<MatchLabelsProps> = ({ labels, onUpdate }) => {
  const addLabel = () => {
    // Generate a unique temporary key to avoid conflicts
    const tempKey = `__temp_key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onUpdate({ ...labels, [tempKey]: '' });
  };

  const updateLabel = (oldKey: string, newKey: string, value: string) => {
    const newLabels = { ...labels };
    delete newLabels[oldKey];
    if (newKey.trim()) {
      newLabels[newKey] = value;
    }
    onUpdate(newLabels);
  };

  const removeLabel = (key: string) => {
    const newLabels = { ...labels };
    delete newLabels[key];
    onUpdate(newLabels);
  };

  return (
    <div className="space-y-1">
      <Label className="text-base text-slate-500">Match Labels</Label>
      {Object.entries(labels).map(([key, value], labelIndex) => (
        <div key={key || `label-${labelIndex}`} className="flex gap-2 items-center">
          <Input
            placeholder="Key"
            value={key.startsWith('__temp_key_') ? '' : key}
            onChange={(e) => updateLabel(key, e.target.value, value)}
            className="flex-1"
          />
          <Input
            placeholder="Value"
            value={value}
            onChange={(e) => updateLabel(key, key, e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => removeLabel(key)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed mt-2"
          onClick={addLabel}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Match Label
        </Button>
      </div>
    </div>
  );
};

// Reusable component for label selector
interface LabelSelectorProps {
  labelSelector: any;
  onUpdate: (labelSelector: any) => void;
  operators?: string[];
}

const LabelSelector: React.FC<LabelSelectorProps> = ({
  labelSelector,
  onUpdate,
  operators = ["In", "NotIn", "Exists", "DoesNotExist"]
}) => {
  const updateMatchLabels = (matchLabels: { [key: string]: string }) => {
    onUpdate({ ...labelSelector, matchLabels });
  };

  const updateMatchExpressions = (matchExpressions: any[]) => {
    onUpdate({ ...labelSelector, matchExpressions });
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium text-slate-600">Label Selector</Label>

      <MatchLabels
        labels={labelSelector?.matchLabels || {}}
        onUpdate={updateMatchLabels}
      />

      <MatchExpressions
        expressions={labelSelector?.matchExpressions || []}
        onUpdate={updateMatchExpressions}
        operators={operators}
      />
    </div>
  );
};

// Reusable component for node selector terms
interface NodeSelectorTermProps {
  term: any;
  onUpdate: (term: any) => void;
  onRemove: () => void;
  termIndex: number;
}

const NodeSelectorTerm: React.FC<NodeSelectorTermProps> = ({ term, onUpdate, onRemove, termIndex }) => {
  const updateMatchExpressions = (matchExpressions: any[]) => {
    onUpdate({ ...term, matchExpressions });
  };

  const updateMatchFields = (matchFields: any[]) => {
    onUpdate({ ...term, matchFields });
  };

  return (
    <Card className="p-10 shadow-none border rounded bg-white">
      <div className="flex justify-between items-center mb-2">
        <span className="text-base font-medium">Node Selector Term {termIndex + 1}</span>
        <Button
          type="button"
          variant="outline"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <MatchExpressions
          expressions={term.matchExpressions || []}
          onUpdate={updateMatchExpressions}
        />

        <MatchExpressions
          expressions={term.matchFields || []}
          onUpdate={updateMatchFields}
        />
      </div>
    </Card>
  );
};

// Reusable component for pod affinity terms
interface PodAffinityTermProps {
  term: any;
  onUpdate: (term: any) => void;
  onRemove: () => void;
  termIndex: number;
  isAntiAffinity?: boolean;
}

const PodAffinityTerm: React.FC<PodAffinityTermProps> = ({
  term,
  onUpdate,
  onRemove,
  termIndex,
  isAntiAffinity = false
}) => {
  const updateLabelSelector = (labelSelector: any) => {
    onUpdate({ ...term, labelSelector });
  };

  const affinityType = isAntiAffinity ? 'Pod Anti-Affinity' : 'Pod Affinity';

  return (
    <Card className="p-10 shadow-none border rounded bg-white">
      <div className="flex justify-between items-center mb-2">
        <span className="text-base font-medium">{affinityType} Term {termIndex + 1}</span>
        <Button
          type="button"
          variant="outline"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Topology Key"
          value={term.topologyKey}
          onChange={(e) => onUpdate({ ...term, topologyKey: e.target.value })}
        />
        <Input
          placeholder="Namespaces (comma-separated)"
          value={term.namespaces?.join(', ') || ''}
          onChange={(e) => onUpdate({
            ...term,
            namespaces: e.target.value.split(',').map(v => v.trim()).filter(v => v)
          })}
        />

        <LabelSelector
          labelSelector={term.labelSelector || {}}
          onUpdate={updateLabelSelector}
        />
      </div>
    </Card>
  );
};

// Reusable component for preferred terms
interface PreferredTermProps {
  pref: any;
  onUpdate: (pref: any) => void;
  onRemove: () => void;
  prefIndex: number;
  isNodeAffinity?: boolean;
  isAntiAffinity?: boolean;
}

const PreferredTerm: React.FC<PreferredTermProps> = ({
  pref,
  onUpdate,
  onRemove,
  prefIndex,
  isNodeAffinity = false,
  isAntiAffinity = false
}) => {
  const updatePreference = (preference: any) => {
    onUpdate({ ...pref, preference });
  };

  const updatePodAffinityTerm = (podAffinityTerm: any) => {
    onUpdate({ ...pref, podAffinityTerm });
  };

  const updateLabelSelector = (labelSelector: any) => {
    if (isNodeAffinity) {
      updatePreference({ ...pref.preference, labelSelector });
    } else {
      updatePodAffinityTerm({ ...pref.podAffinityTerm, labelSelector });
    }
  };

  const affinityType = isAntiAffinity ? 'Pod Anti-Affinity' : isNodeAffinity ? 'Node' : 'Pod Affinity';

  return (
    <Card className="p-10 shadow-none border rounded bg-white">
      <div className="flex justify-between items-center mb-2">
        <span className="text-base font-medium">Preferred {affinityType} Term {prefIndex + 1}</span>
        <Button
          type="button"
          variant="outline"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Input
          type="number"
          placeholder="Weight"
          value={pref.weight}
          onChange={(e) => onUpdate({ ...pref, weight: parseInt(e.target.value) })}
          className="w-24"
        />

        {!isNodeAffinity && (
          <>
            <Input
              placeholder="Topology Key"
              value={pref.podAffinityTerm.topologyKey}
              onChange={(e) => updatePodAffinityTerm({
                ...pref.podAffinityTerm,
                topologyKey: e.target.value
              })}
            />
            <Input
              placeholder="Namespaces (comma-separated)"
              value={pref.podAffinityTerm.namespaces?.join(', ') || ''}
              onChange={(e) => updatePodAffinityTerm({
                ...pref.podAffinityTerm,
                namespaces: e.target.value.split(',').map(v => v.trim()).filter(v => v)
              })}
            />
          </>
        )}

        {isNodeAffinity ? (
          <div className="space-y-4">
            <MatchExpressions
              expressions={pref.preference?.matchExpressions || []}
              onUpdate={(expressions) => updatePreference({ ...pref.preference, matchExpressions: expressions })}
            />
            <MatchExpressions
              expressions={pref.preference?.matchFields || []}
              onUpdate={(fields) => updatePreference({ ...pref.preference, matchFields: fields })}
            />
          </div>
        ) : (
          <LabelSelector
            labelSelector={pref.podAffinityTerm?.labelSelector || {}}
            onUpdate={updateLabelSelector}
          />
        )}
      </div>
    </Card>
  );
};

const Affinity: React.FC<AffinityProps> = ({ form }) => {
  const formData = form.watch();

  const addAffinityType = (type: 'nodeAffinity' | 'podAffinity' | 'podAntiAffinity') => {
    const currentAffinity = formData.affinity || {} as K8sAffinity;
    let newAffinitySection;

    switch (type) {
      case 'nodeAffinity':
        newAffinitySection = {
          requiredDuringSchedulingIgnoredDuringExecution: {
            nodeSelectorTerms: []
          },
          preferredDuringSchedulingIgnoredDuringExecution: []
        };
        break;
      case 'podAffinity':
        newAffinitySection = {
          requiredDuringSchedulingIgnoredDuringExecution: [],
          preferredDuringSchedulingIgnoredDuringExecution: []
        };
        break;
      case 'podAntiAffinity':
        newAffinitySection = {
          requiredDuringSchedulingIgnoredDuringExecution: [],
          preferredDuringSchedulingIgnoredDuringExecution: []
        };
        break;
    }

    form.setValue("affinity", {
      ...currentAffinity,
      [type]: newAffinitySection
    } as K8sAffinity);
  };

  const removeAffinityType = (type: 'nodeAffinity' | 'podAffinity' | 'podAntiAffinity') => {
    const currentAffinity = formData.affinity || {} as K8sAffinity;
    const newAffinity = { ...currentAffinity };
    delete (newAffinity as any)[type];

    // If no affinity types remain, set to undefined
    const hasAnyAffinity = Object.keys(newAffinity).length > 0;
    form.setValue("affinity", hasAnyAffinity ? newAffinity : undefined);
  };

  return (
    <Card className="p-4 shadow-none border">
      <CardHeader>
        <CardTitle className="text-xl font-medium text-slate-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-slate-600" />
          Affinity Rules
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure pod placement rules for scheduling</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Affinity Type Controls */}
        <div className="space-y-2">
          <Label className="text-base font-medium text-slate-700">
            Affinity Types
          </Label>
          <div className="flex flex-wrap gap-2">
            {!formData.affinity?.nodeAffinity && (
              <Button
                type="button"
                variant="outline"
                onClick={() => addAffinityType('nodeAffinity')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Node Affinity
              </Button>
            )}
            {!formData.affinity?.podAffinity && (
              <Button
                type="button"
                variant="outline"
                onClick={() => addAffinityType('podAffinity')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Pod Affinity
              </Button>
            )}
            {!formData.affinity?.podAntiAffinity && (
              <Button
                type="button"
                variant="outline"
                onClick={() => addAffinityType('podAntiAffinity')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Pod Anti-Affinity
              </Button>
            )}
          </div>
        </div>

        {/* Node Affinity */}
        {formData.affinity?.nodeAffinity && (
          <Card className="space-y-4 p-10 shadow-none border rounded-lg bg-slate-50">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-medium text-slate-800">Node Affinity</h4>
              <Button
                type="button"
                variant="outline"
                onClick={() => removeAffinityType('nodeAffinity')}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>

            {/* Required During Scheduling */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">
                Required During Scheduling
              </Label>
              <div className="space-y-2">
                {formData.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution?.nodeSelectorTerms?.map((term: any, termIndex: number) => (
                  <NodeSelectorTerm
                    key={termIndex}
                    term={term}
                    termIndex={termIndex}
                    onUpdate={(updatedTerm: any) => {
                      updateNodeAffinityTerm(form, (nodeAffinity: any) => {
                        if (nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
                          nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[termIndex] = updatedTerm;
                        }
                      });
                    }}
                    onRemove={() => {
                      updateNodeAffinityTerm(form, (nodeAffinity: any) => {
                        if (nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
                          nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms =
                            nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.filter((_: any, i: number) => i !== termIndex);
                        }
                      });
                    }}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed mt-2"
                  onClick={() => {
                    updateNodeAffinityTerm(form, (nodeAffinity) => {
                      if (!nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
                        nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution = { nodeSelectorTerms: [] };
                      }
                      nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.push({
                        matchExpressions: []
                      });
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Node Selector Term
                </Button>
              </div>
            </div>

            {/* Preferred During Scheduling */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">
                Preferred During Scheduling
              </Label>
              <div className="space-y-2">
                {formData.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution?.map((pref: any, prefIndex: number) => (
                  <PreferredTerm
                    key={prefIndex}
                    pref={pref}
                    prefIndex={prefIndex}
                    isNodeAffinity={true}
                    onUpdate={(updatedPref: any) => {
                      updateNodeAffinityTerm(form, (nodeAffinity: any) => {
                        if (nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
                          nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[prefIndex] = updatedPref;
                        }
                      });
                    }}
                    onRemove={() => {
                      updateNodeAffinityTerm(form, (nodeAffinity: any) => {
                        if (nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
                          nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution =
                            nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution.filter((_: any, i: number) => i !== prefIndex);
                        }
                      });
                    }}
                  />
                ))}
                <Button
                  type="button"
                  className="w-full border-dashed mt-2"
                  variant="outline"
                  onClick={() => {
                    updateNodeAffinityTerm(form, (nodeAffinity) => {
                      if (!nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
                        nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution = [];
                      }
                      nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution.push({
                        weight: 1,
                        preference: {
                          matchExpressions: []
                        }
                      });
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Preferred Term
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Pod Affinity */}
        {formData.affinity?.podAffinity && (
          <Card className="space-y-4 p-10 shadow-none border rounded-lg bg-slate-50">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-medium text-slate-800">Pod Affinity</h4>
              <Button
                type="button"
                variant="outline"
                onClick={() => removeAffinityType('podAffinity')}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>

            {/* Required During Scheduling */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">
                Required During Scheduling
              </Label>
              <div className="space-y-2">
                {formData.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution?.map((term: any, termIndex: number) => (
                  <PodAffinityTerm
                    key={termIndex}
                    term={term}
                    termIndex={termIndex}
                    onUpdate={(updatedTerm: any) => {
                      updatePodAffinityTerm(form, (podAffinity: any) => {
                        if (podAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
                          podAffinity.requiredDuringSchedulingIgnoredDuringExecution[termIndex] = updatedTerm;
                        }
                      });
                    }}
                    onRemove={() => {
                      updatePodAffinityTerm(form, (podAffinity: any) => {
                        if (podAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
                          podAffinity.requiredDuringSchedulingIgnoredDuringExecution =
                            podAffinity.requiredDuringSchedulingIgnoredDuringExecution.filter((_: any, i: number) => i !== termIndex);
                        }
                      });
                    }}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed mt-2"
                  onClick={() => {
                    updatePodAffinityTerm(form, (podAffinity: any) => {
                      if (!podAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
                        podAffinity.requiredDuringSchedulingIgnoredDuringExecution = [];
                      }
                      podAffinity.requiredDuringSchedulingIgnoredDuringExecution.push({
                        topologyKey: '',
                        labelSelector: {}
                      });
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Pod Affinity Term
                </Button>
              </div>
            </div>

            {/* Preferred During Scheduling */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">
                Preferred During Scheduling
              </Label>
              <div className="space-y-2">
                {formData.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution?.map((pref: any, prefIndex: number) => (
                  <PreferredTerm
                    key={prefIndex}
                    pref={pref}
                    prefIndex={prefIndex}
                    onUpdate={(updatedPref: any) => {
                      updatePodAffinityTerm(form, (podAffinity: any) => {
                        if (podAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
                          podAffinity.preferredDuringSchedulingIgnoredDuringExecution[prefIndex] = updatedPref;
                        }
                      });
                    }}
                    onRemove={() => {
                      updatePodAffinityTerm(form, (podAffinity: any) => {
                        if (podAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
                          podAffinity.preferredDuringSchedulingIgnoredDuringExecution =
                            podAffinity.preferredDuringSchedulingIgnoredDuringExecution.filter((_: any, i: number) => i !== prefIndex);
                        }
                      });
                    }}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed mt-2"
                  onClick={() => {
                    updatePodAffinityTerm(form, (podAffinity: any) => {
                      if (!podAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
                        podAffinity.preferredDuringSchedulingIgnoredDuringExecution = [];
                      }
                      podAffinity.preferredDuringSchedulingIgnoredDuringExecution.push({
                        weight: 1,
                        podAffinityTerm: {
                          topologyKey: '',
                          labelSelector: {}
                        }
                      });
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Preferred Term
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Pod Anti-Affinity */}
        {formData.affinity?.podAntiAffinity && (
          <Card className="space-y-4 p-10 shadow-none border rounded-lg bg-slate-50">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-medium text-slate-800">Pod Anti-Affinity</h4>
              <Button
                type="button"
                variant="outline"
                onClick={() => removeAffinityType('podAntiAffinity')}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>

            {/* Required During Scheduling */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">
                Required During Scheduling
              </Label>
              <div className="space-y-2">
                {formData.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution?.map((term: any, termIndex: number) => (
                  <PodAffinityTerm
                    key={termIndex}
                    term={term}
                    termIndex={termIndex}
                    isAntiAffinity={true}
                    onUpdate={(updatedTerm: any) => {
                      updatePodAntiAffinityTerm(form, (podAntiAffinity: any) => {
                        if (podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
                          podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[termIndex] = updatedTerm;
                        }
                      });
                    }}
                    onRemove={() => {
                      updatePodAntiAffinityTerm(form, (podAntiAffinity: any) => {
                        if (podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
                          podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution =
                            podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution.filter((_: any, i: number) => i !== termIndex);
                        }
                      });
                    }}
                  />
                ))}
                <Button
                  type="button"
                  className="w-full border-dashed mt-2"
                  variant="outline"
                  onClick={() => {
                    updatePodAntiAffinityTerm(form, (podAntiAffinity: any) => {
                      if (!podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
                        podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution = [];
                      }
                      podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution.push({
                        topologyKey: '',
                        labelSelector: {}
                      });
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Pod Anti-Affinity Term
                </Button>
              </div>
            </div>

            {/* Preferred During Scheduling */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">
                Preferred During Scheduling
              </Label>
              <div className="space-y-2">
                {formData.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution?.map((pref: any, prefIndex: number) => (
                  <PreferredTerm
                    key={prefIndex}
                    pref={pref}
                    prefIndex={prefIndex}
                    isAntiAffinity={true}
                    onUpdate={(updatedPref: any) => {
                      updatePodAntiAffinityTerm(form, (podAntiAffinity: any) => {
                        if (podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
                          podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[prefIndex] = updatedPref;
                        }
                      });
                    }}
                    onRemove={() => {
                      updatePodAntiAffinityTerm(form, (podAntiAffinity: any) => {
                        if (podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
                          podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution =
                            podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution.filter((_: any, i: number) => i !== prefIndex);
                        }
                      });
                    }}
                  />
                ))}
                <Button
                  type="button"
                  className="w-full border-dashed mt-2"
                  variant="outline"
                  onClick={() => {
                    updatePodAntiAffinityTerm(form, (podAntiAffinity: any) => {
                      if (!podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution) {
                        podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution = [];
                      }
                      podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution.push({
                        weight: 1,
                        podAffinityTerm: {
                          topologyKey: '',
                          labelSelector: {}
                        }
                      });
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Preferred Term
                </Button>
              </div>
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default Affinity; 