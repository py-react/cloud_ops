import React from "react";
import { Info, AlertTriangle } from "lucide-react";
import { TooltipWrapper } from "@/components/ui/tooltip";

const scopeDescriptions: Record<string, string> = {
  Terminating: "Match pods where .spec.activeDeadlineSeconds >= 0",
  NotTerminating: "Match pods where .spec.activeDeadlineSeconds is nil",
  BestEffort: "Match pods that have best effort quality of service.",
  NotBestEffort: "Match pods that do not have best effort quality of service.",
  PriorityClass: "Match pods that references the specified priority class.",
  CrossNamespacePodAffinity: "Match pods that have cross-namespace pod (anti)affinity terms.",
  VolumeAttributesClass: "Match persistentvolumeclaims that references the specified volume attributes class.",
};

const mutuallyExclusiveScopes = [
  ["Terminating", "NotTerminating"],
  ["BestEffort", "NotBestEffort"],
];

function hasMutuallyExclusive(scopes: string[]) {
  return mutuallyExclusiveScopes.some(
    ([a, b]) => scopes.includes(a) && scopes.includes(b)
  );
}

function QuotaScopes({ quota }: { quota: Record<string, any> }) {
  const scopes = quota.spec.scopes || [];
  const hasConflict = hasMutuallyExclusive(scopes);

  return (
    <div className="border rounded-lg p-4 bg-gray-50 mt-4">
      {hasConflict && (
        <div className="flex items-center gap-2 text-xs text-red-600 mb-2">
          <AlertTriangle className="w-4 h-4" />
          Mutually exclusive scopes detected (e.g., Terminating & NotTerminating, BestEffort & NotBestEffort).
        </div>
      )}
      {quota.spec.scopes && (
        <div className="mb-2">
          <div className="font-medium text-xs text-gray-600">Scopes:</div>
          <ul className="list-disc ml-5">
            {quota.spec.scopes.map((scope: string) => (
              <li key={scope}>
                <span className="font-mono">{scope}</span>
                {scopeDescriptions[scope] && (
                  <TooltipWrapper content={scopeDescriptions[scope]}>
                    <Info className="inline w-3 h-3 ml-1 text-blue-400 cursor-pointer" />
                  </TooltipWrapper>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {quota.spec.scope_selector && quota.spec.scope_selector.match_expressions && (
        <div>
          <div className="font-medium text-xs text-gray-600">Scope Selector:</div>
          <ul className="list-disc ml-5">
            {quota.spec.scope_selector.match_expressions.map((expr: any, idx: number) => (
              <li key={idx}>
                <span className="font-mono">{expr.scopeName}</span>
                <span className="ml-1">{expr.operator}</span>
                {expr.values && (
                  <span className="ml-1">[{expr.values.join(", ")}]</span>
                )}
                {scopeDescriptions[expr.scopeName] && (
                  <TooltipWrapper content={scopeDescriptions[expr.scopeName]}>
                    <Info className="inline w-3 h-3 ml-1 text-blue-400 cursor-pointer" />
                  </TooltipWrapper>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!quota.spec.scopes && !(quota.spec.scope_selector && quota.spec.scope_selector.match_expressions) && (
        <div className="text-xs text-gray-500">No scopes defined for this quota.</div>
      )}
    </div>
  );
}

export default QuotaScopes; 