import { Activity, Loader2 } from 'lucide-react'
import React from 'react'

export const ClusterInfo = ({
  nodesCount,
  podsCount,
  runningPods,
  namespacesCount,
  isLoading,
  error
}: {
  nodesCount: number;
  podsCount: number;
  runningPods: number;
  namespacesCount: number;
  isLoading: boolean;
  error:string
}) => {
  return (
    <div
      className={"p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200"}
    >
      <div className="flex items-center justify-between mb-4 px-6 pt-6">
        <h2 className={`text-lg font-semibold ${"text-gray-800"}`}>
          Cluster Overview
        </h2>
        <div
          className={`px-2 py-1 rounded-[calc(0.5rem-2px)] inline-flex items-center space-x-1 ${
            podsCount - runningPods === 0
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          <Activity size={14} />
          {podsCount - runningPods === 0 ? (
            <span className="text-xs font-medium">Healthy</span>
          ) : (
            <span className="text-xs font-medium">Warning</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-6">
        <div className={`p-3 rounded-[0.5rem] ${"bg-gray-50"}`}>
          <div className="text-sm text-gray-500 dark:text-gray-400">Nodes</div>
          <InfoText isLoading={isLoading} error={error} text={nodesCount} />
        </div>
        <div className={`p-3 rounded-[0.5rem] ${"bg-gray-50"}`}>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Namespaces
          </div>
          <InfoText isLoading={isLoading} error={error} text={namespacesCount} />
        </div>
        <div className={`p-3 rounded-[0.5rem] ${"bg-gray-50"}`}>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Pods
          </div>
          <InfoText isLoading={isLoading} error={error} text={podsCount} />
        </div>
        <div className={`p-3 rounded-[0.5rem] ${"bg-gray-50"}`}>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Pod Status
          </div>
          <InfoText isLoading={isLoading} error={error} text={`${runningPods}/${podsCount}`} />
        </div>
      </div>
    </div>
  );
};

const InfoText = ({ text, isLoading, error }) => {
  return (
    <div className={`text-xl font-semibold ${"text-gray-900"}`}>
      {error ? error : isLoading ? <Loader2 className="animate-spin" /> : text}
    </div>
  );
};

export default ClusterInfo