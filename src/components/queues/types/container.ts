export interface Container {
    prefix:string
    queueName:string
    name: string;
    processor: string;
    id: string;
    status: string;
    created: string;
    logs: string;
    finishedAt:string
    queueProps:Record<string,any>
  }
  
  export interface RunContainerPayload {
    queueName: string;
    prefix: string;
    processFileName: string;
  }
  
  export interface StopContainerPayload {
    containerName: string;
  }