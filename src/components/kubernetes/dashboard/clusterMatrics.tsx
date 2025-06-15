import React from "react";
import { Cpu, Database, HardDrive, Loader2 } from "lucide-react";

const metrics = [
  {
    name: "CPU Usage",
    value: "45%",
    icon: <Cpu size={18} />,
    color: "bg-blue-100 text-blue-600",
    progress: 0,
  },
  {
    name: "Memory Usage",
    value: "68%",
    icon: <Database size={18} />,
    color: "bg-yellow-100 text-yellow-600",
    progress: 0,
  },
  {
    name: "Disk Usage",
    value: "32%",
    icon: <HardDrive size={18} />,
    color: "bg-green-100 text-green-600",
    progress: 0,
  },
];

export const ClusterMetrics = ({
  usage,
  isLoading,
  error
}: {
  usage: { disk: number; memory: number; cpu: number };
  isLoading:boolean
  error:string
}) => {
  metrics[0].progress = usage.cpu || 0;
  metrics[0].value = `${usage.cpu || 0}%`;
  metrics[1].progress = usage.memory || 0;
  metrics[1].value = `${usage.memory || 0}%`;
  metrics[2].progress = usage.disk || 0;
  metrics[2].value = `${usage.disk || 0}%`;

  return (
    <div
      className={`p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200`}
    >
      <h2 className={`text-lg font-semibold mb-4 text-gray-800 px-6 pt-6`}>
        Cluster Metrics
      </h2>

      <div className="space-y-4 px-6 pb-6">
        {metrics.map((metric) => (
          <div key={metric.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`p-1.5 rounded-[calc(0.5rem-2px)] ${metric.color}`}
                >
                  {metric.icon}
                </div>
                <span className={"text-gray-700"}>{metric.name}</span>
              </div>
              <span className={`font-medium text-gray-800`}>
                {isLoading?<Loader2 className="animate-spin"/>:metric.value}
              </span>
            </div>

            <div
              className={`h-2 w-full rounded-full overflow-hidden bg-gray-200`}
            >
            {isLoading?(
                <div className="p-3 rounded-[0.5rem] bg-gray-50 transition-all duration-200 hover:shadow-md relative overflow-hidden w-full h-full">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
            ):(
                <div
                  className={`h-full rounded-full ${
                    metric.progress > 80
                      ? "bg-red-500"
                      : metric.progress > 60
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${metric.progress}%` }}
                />
            )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClusterMetrics;
