import React, { useState } from "react";
import { StatusBadge } from "@/components/kubernetes/dashboard/statusBadge";
import { Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function Events({
  events,
  isLoading,
  error,
}: {
  events: Record<string, any>;
  isLoading: boolean;
  error: string;
}) {
  const [showAllEvents, setShowAllEvents] = useState(false);

  return (
    <div className="p-4 rounded-[0.5rem]  shadow-sm mb-6 bg-white border border-gray-200">
      <div className="flex items-center justify-between mb-4 px-6 pt-6">
        <h2 className="text-lg font-semibold text-gray-800">Recent Events</h2>
        <button
          onClick={() => setShowAllEvents((prev) => !prev)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {!!showAllEvents ? "Show less" : "View all"}
        </button>
      </div>
      <div className="space-y-4 px-6 pb-6">
        {error && <p className="text-red-500">{error}</p>}
        {isLoading && (
          <>
            {new Array(4).fill(null).map(item=>{
                return (
                    <div className="p-3 rounded-[0.5rem] bg-gray-50 transition-all duration-200 hover:shadow-md relative overflow-hidden w-full h-[100px]">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                )
            })}
          </>
        )}
        {!isLoading &&
          (!!showAllEvents ? events : events.slice(0, 10))
            ?.sort(
              (a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp)
            )
            ?.map((data) => {
              const involvedObject = data.involvedObject;
              return (
                <div
                  key={
                    data.kind + data.reason + data.type + involvedObject.name
                  }
                  className="p-3 rounded-[0.5rem] bg-gray-50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={data.type} />
                      <span className="font-medium text-gray-800">
                        {involvedObject.kind}: {involvedObject.name}
                      </span>
                    </div>
                    <div className="flex items-center mt-2 md:mt-0">
                      <Clock size={14} className="text-gray-500" />
                      <span className="ml-1 text-xs text-gray-500">
                        {data.lastTimestamp}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{data.message}</p>
                  <div className="text-xs mt-1 px-2 py-0.5 rounded-[0.25rem] inline-block bg-gray-200 text-gray-600">
                    {involvedObject.namespace}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

export default Events;
