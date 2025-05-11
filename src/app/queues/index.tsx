import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle,
  Clock,
  ClockAlertIcon,
  ListStartIcon,
  XCircle,
} from "lucide-react";
import { MetricsCard } from "@/components/metrics/MetricsCard";
import { JobTable } from "@/components/jobs/JobTable";
import { Tabs } from "@/components/ui/tabs";
import { ContainerDashboard } from "@/components/queues/ContainerDashboard";
import { Button } from "@/components/ui/button";
import { JobFormModal } from "@/components/queues/queueJob/JobFormModal";
import { addItemToQueue } from "@/components/queues/services/api";

function sortArrayOfArraysByAddedTimestamp(arrayOfArrays) {
  // Flatten the array of arrays into a single array
  const flattenedArray = arrayOfArrays.flat();

  // Sort the flattened array by 'timestamps.added'
  const sortedArray = flattenedArray.sort(
    (a, b) => b.timestamps.added - a.timestamps.added
  );

  return sortedArray;
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "queues", label: "Queues" },
];

function App({
  totalQueuesConnected,
  totalActiveJobs,
  totalCompletedJobs,
  totalFailedJobs,
  totalWaitingJobs,
  totalDelayedJobs,
  allQueues,
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [jobs,setJobs] = useState(
    sortArrayOfArraysByAddedTimestamp(
      (allQueues||[]).reduce((acc, item) => {
        acc.push(item.jobs);
        return acc;
      }, [])
    )
  );

  useEffect(()=>{
    if(allQueues){
      setJobs(
        sortArrayOfArraysByAddedTimestamp(
          (allQueues).reduce((acc, item) => {
            acc.push(item.jobs);
            return acc;
          }, [])
        )
      )
    }
  },[allQueues])

  const handleRetry = async (id: string, queueName: string) => {
    console.log("Retrying job:", id, queueName);
    await fetch("/api/queueJob", {
      method: "PUT",
      body: JSON.stringify({ id, queueName }),
    });
    window.location.reload();
  };

  const handleDelete = async (id: string, queueName: string) => {
    console.log("Deleting job:", id, queueName);
    await fetch("/api/queueJob", {
      method: "DELETE",
      body: JSON.stringify({ id, queueName }),
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-lg font-semibold text-gray-900">
              Job Queue Management
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-8">
          {activeTab === "overview" ? (
            <div className="space-y-8">
              <Button
                onClick={() => {
                  setOpen(true);
                }}
              >
                Add Job
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <MetricsCard
                  icon={ClockAlertIcon}
                  label="Waiting"
                  value={totalWaitingJobs}
                  iconClassName="bg-yellow-50 text-yellow-600"
                />
                <MetricsCard
                  icon={Activity}
                  label="Active"
                  value={totalActiveJobs}
                  iconClassName="bg-blue-50 text-blue-600"
                />
                <MetricsCard
                  icon={CheckCircle}
                  label="Completed"
                  value={totalCompletedJobs}
                  iconClassName="bg-green-50 text-green-600"
                />
                <MetricsCard
                  icon={XCircle}
                  label="Failed"
                  value={totalFailedJobs}
                  iconClassName="bg-red-50 text-red-600"
                />
                <MetricsCard
                  icon={Clock}
                  label="Delayed"
                  value={totalDelayedJobs}
                />
                <MetricsCard
                  label="All"
                  icon={ListStartIcon}
                  value={
                    totalActiveJobs +
                    totalCompletedJobs +
                    totalFailedJobs +
                    totalWaitingJobs +
                    totalDelayedJobs
                  }
                  iconClassName="bg-green-50 text-green-600"
                />
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Jobs
                </h2>
                <JobTable
                  jobs={jobs}
                  onRetry={handleRetry}
                  onDelete={handleDelete}
                />
              </div>
              
            </div>
          ) :  (
            <ContainerDashboard />
          )}
        </div>
        <JobFormModal
          isOpen={open}
          onClose={() => {
            setOpen(false);
          }}
          onSubmit={async(data) => {
            const response = await addItemToQueue(data)
            window.location.reload()
          }}
        />
      </main>
    </div>
  );
}

export default App;
