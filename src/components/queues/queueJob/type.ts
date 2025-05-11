export interface JobMeta {
    id: string;
    name: string;
    delay?: number;
    attempts?: number;
    repeat?: {
      endDate?: Date;
      count?: number;
      every?: number;
      immediately?: boolean;
      limit?: number;
      cron?: string;
      startDate?: Date;
      tz?: string;
    };
  }
  
  export interface JobFormData {
    queueName: string;
    meta: JobMeta;
    data: Record<string, unknown>;
  }