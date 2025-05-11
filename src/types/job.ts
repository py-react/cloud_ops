export interface IJobData {
  meta: {
    id: string;
    name?: string;
    createdBy?: string;
    createdAt?: Date;
  };
  job: () => void;
  onActive?: (jobMeta: IJobData["meta"], jobPromise: any, queueJobId: string) => void;
  onComplete?: (jobMeta: IJobData["meta"], result: any, queueJobId: string) => void;
  onStalled?: (jobMeta: IJobData["meta"], queueJobId: string) => void;
  onError?: (jobMeta: IJobData["meta"], error: Error, queueJobId: string) => void;
  onWaiting?: (queueJobId: string) => void;
  onProgress?: (progress: any, jobMeta: IJobData["meta"], queueJobId: string) => void;
  onFailed?: (jobMeta: IJobData["meta"], error: any, queueJobId: string) => void;
}

export interface Job {
  id: string;
  name: string;
  type: 'immediate' | 'delayed' | 'recurring';
  status: 'waiting' | 'active' | 'completed' | 'failed';
  data: {
    obj:Record<string, unknown>
    [key:string]:unknown
  };
  priority?: number;
  delay?: number;
  attempts?: number;
  cron?: string;
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
  return_value:{
    data?:Record<string, unknown>
    meta?:Record<string, unknown>
    repeat_id?:Record<string, unknown>
    repeatOtps?:Record<string, unknown>
    [key:string]:unknown
  };
}
