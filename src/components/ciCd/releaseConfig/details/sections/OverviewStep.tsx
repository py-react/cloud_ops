import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileCog, CalendarPlus, Info } from "lucide-react";

export interface OverviewStepProps {
  config: any;
}

export const OverviewStep = ({ config }:OverviewStepProps) => {
  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileCog className="w-3.5 h-3.5" />
            <span>Deployment Name</span>
          </div>
          <div className="my-1 px-2 text-sm text-gray-500 break-words overflow-x-auto">
            {config.deployment_name}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Namespace</span>
          </div>
          <div className="my-1 px-2 text-sm text-gray-500 ">{config.namespace}</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="w-3.5 h-3.5" />
            <span>Tag</span>
          </div>
          <div className="my-1 px-2 text-sm text-gray-500 ">{config.tag}</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="w-3.5 h-3.5" />
            <span>Strategy ID</span>
          </div>
          <div className="my-1 px-2 text-sm text-gray-500 ">{config.deployment_strategy_id}</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="w-3.5 h-3.5" />
            <span>Replicas</span>
          </div>
          <div className="my-1 px-2 text-sm text-gray-500 ">{config.replicas}</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="w-3.5 h-3.5" />
            <span>Source Control Name</span>
          </div>
          <div className="my-1 px-2 text-sm text-gray-500 ">{config.code_source_control_name}</div>
        </div>
      </div>
      {/* Labels and Annotations */}
      {Object.keys(config.labels || {}).length > 0 && (
        <div className="my-2">
          <div className="font-semibold text-xs mb-1">Labels:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(config.labels).map(([key, value]) => (
              <span key={key} className="bg-gray-100 text-xs px-2 py-1 rounded border font-mono">
                {key}: {String(value)}
              </span>
            ))}
          </div>
        </div>
      )}
      {Object.keys(config.annotations || {}).length > 0 && (
        <div className="my-2">
          <div className="font-semibold text-xs mb-1">Annotations:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(config.annotations).map(([key, value]) => (
              <span key={key} className="bg-gray-50 text-xs px-2 py-1 rounded border font-mono">
                {key}: {String(value)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 