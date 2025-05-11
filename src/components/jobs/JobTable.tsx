import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Play, Pause, RefreshCw, Trash2 } from 'lucide-react';
import { formatDistance, formatRelative } from 'date-fns';
import type { Job } from 'src/types/job';
import { Card } from '@/components/ui/card';
import { cn } from 'src/libs/utils';
import SmartDataViewer from '@/components/queues/queueJob/SmartDataViewer';

interface JobListProps {
  jobs: Job[];
  onRetry?: (id: string) => void;
  onDelete?: (id: string) => void;
}

type JobsStructure = {
  jobs: Job[];
  repeatJobs: Record<string, Job[]>;
};

function restructureJobs(jobs: Job[]): JobsStructure {
  const jobsMap: JobsStructure = {
    jobs: [],
    repeatJobs: {}
  };

  jobs.forEach((job) => {
    if ((job.job_id as string).startsWith("repeat:")) {
      const chunked = (job.job_id as string).split(":")
      chunked.pop()
      if (chunked.join(":") in jobsMap.repeatJobs) {
        jobsMap.repeatJobs[chunked.join(":")].push(job);
      } else {
        jobsMap.repeatJobs[chunked.join(":")] = [job];
      }
      return
    }
    jobsMap.jobs.push(job);
  });

  return jobsMap;
}

const JobCard = ({ 
  job, 
  isChild = false,
  repeatJobs = [],
  onRetry,
  onDelete 
}: { 
  job: Job; 
  isChild?: boolean;
  repeatJobs?: Job[];
  onRetry?: (id: string) => void;
  onDelete?: (id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getStatusStyle = (status: Job['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'completed':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'failed':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  const hasRepeatJobs = repeatJobs.length > 0;
  const expectedRepeatCount = job.return_value?.repeatOtps?.limit || '∞';

  return (
    <div>
      <Card className={cn(
        "p-4 transition-all duration-200 hover:shadow-md",
        isChild ? "border-l-4 border-l-blue-500" : ""
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-medium text-gray-900">{job.job_id}</h3>
            <p className="text-sm text-gray-500">{job.queueName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
              getStatusStyle(job.job_state)
            )}>
              {job.job_state}
            </span>
            <div className="flex gap-1">
              {job.job_state === 'failed' && (
                <button
                  onClick={() => onRetry?.(job.job_id,job.queueName)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              {job.job_state === 'active' && (
                <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                  <Pause className="w-4 h-4" />
                </button>
              )}
              {job.job_state === 'waiting' && (
                <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                  <Play className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDelete?.(job.job_id,job.queueName)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Created</p>
            <p className="mt-1 text-sm text-gray-900">
              {formatRelative(new Date(job.timestamps.added), new Date())}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Processed</p>
            <p className="mt-1 text-sm text-gray-900">
              {formatRelative(new Date(job.timestamps.processed), new Date())}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Finished</p>
            <p className="mt-1 text-sm text-gray-900">
              {formatRelative(new Date(job.timestamps.finished), new Date())}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Time taken</p>
            <p className="mt-1 text-sm text-gray-900">
              {formatDistance(new Date(job.timestamps.processed), new Date(job.timestamps.finished), { addSuffix: false })}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <SmartDataViewer 
            data={{"Job Data": job.data.obj, "Result": job.return_value}} 
            label='Details' 
            initiallyOpen={false} 
          />
          
          {hasRepeatJobs && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 w-full text-sm"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="font-medium">Repeat Jobs:</span>
              <span>{repeatJobs.length} of {expectedRepeatCount}</span>
            </button>
          )}
        </div>
      </Card>

      {isExpanded && hasRepeatJobs && (
        <div className="ml-8 mt-2 space-y-2">
          {repeatJobs.map(repeatJob => (
            <JobCard 
              key={repeatJob.job_id + "_" + repeatJob.queueName}
              job={repeatJob}
              isChild={true}
              onRetry={onRetry}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function JobTable({ jobs, onRetry, onDelete }: JobListProps) {
  const currentJobs = useMemo(() => restructureJobs(jobs), [jobs]);

  return (
    <div className="space-y-4">
      {currentJobs.jobs.map((job) => {
        const repeatId = job.return_value?.repeat_id?.split(":").slice(0, -1).join(":");
        const repeatJobs = repeatId ? currentJobs.repeatJobs[repeatId] || [] : [];

        return (
          <JobCard
            key={job.job_id + "_" + job.queueName}
            job={job}
            repeatJobs={repeatJobs}
            onRetry={onRetry}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}