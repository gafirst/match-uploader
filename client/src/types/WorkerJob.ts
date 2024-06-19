export const WORKER_JOB_CREATED = "worker:job:created";
export const WORKER_JOB_START = "worker:job:start";
export const WORKER_JOB_COMPLETE = "worker:job:complete";

export type WorkerEvent = typeof WORKER_JOB_CREATED | typeof WORKER_JOB_START | typeof WORKER_JOB_COMPLETE;


export enum WorkerJobStatus {
  PENDING = "PENDING",
  STARTED = "STARTED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  FAILED_RETRYABLE = "FAILED_RETRYABLE",
}

/**
 * Converts WorkerJobStatus to a number, suitable for sorting in a queue order
 *
 * @param status
 */
export function workerJobStatusAsNumber(status: WorkerJobStatus) {
  const outputMap: Record<WorkerJobStatus, number> = {
    [WorkerJobStatus.STARTED]: 0,
    [WorkerJobStatus.FAILED_RETRYABLE]: 1,
    [WorkerJobStatus.PENDING]: 2,
    [WorkerJobStatus.FAILED]: 3,
    [WorkerJobStatus.COMPLETED]: 4,
  };

  return outputMap[status];
}

/**
 * Converts a WorkerJobStatus to a string suitable for display in the UI. Will always return a lowercase string, so you
 * may need to adjust capitalization depending on the context.
 */
export function workerJobStatusToUiString(status: WorkerJobStatus) {
  const outputMap: Record<WorkerJobStatus, string> = {
    [WorkerJobStatus.PENDING]: "pending",
    [WorkerJobStatus.STARTED]: "started",
    [WorkerJobStatus.COMPLETED]: "completed",
    [WorkerJobStatus.FAILED]: "failed",
    [WorkerJobStatus.FAILED_RETRYABLE]: "failed (retryable)",
  };

  return outputMap[status];
}

export interface WorkerJob {
  jobId: string;
  workerId: string | null;
  task: string;
  title: string;
  status: WorkerJobStatus;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  youTubeVideoId: string | null;
  addedToYouTubePlaylist: boolean | null;
  linkedOnTheBlueAlliance: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerEvents<EventName extends WorkerEvent> {
  event: EventName;
  workerJob: WorkerJob;
}

function isWorkerJob(x: unknown): x is WorkerJob {
  return typeof x === "object" &&
    x !== null &&
    "jobId" in x &&
    "workerId" in x &&
    "task" in x &&
    "title" in x &&
    "status" in x &&
    "error" in x &&
    "attempts" in x &&
    "maxAttempts" in x &&
    "youTubeVideoId" in x &&
    "addedToYouTubePlaylist" in x &&
    "linkedOnTheBlueAlliance" in x &&
    "createdAt" in x &&
    "updatedAt" in x;
}

export function isWorkerEvent(x: unknown): x is WorkerEvents<WorkerEvent> {
  return x !== null &&
    typeof x === "object" &&
    (x as WorkerEvents<WorkerEvent>).event !== undefined &&
    isWorkerJob((x as WorkerEvents<WorkerEvent>).workerJob);

}

export function isWorkerJobCreatedEvent(x: unknown): x is WorkerEvents<typeof WORKER_JOB_CREATED> {
  return x !== null &&
    typeof x === "object" &&
    (x as WorkerEvents<typeof WORKER_JOB_CREATED>).event === WORKER_JOB_CREATED &&
    isWorkerJob((x as WorkerEvents<typeof WORKER_JOB_CREATED>).workerJob);
}

export function isWorkerJobStartEvent(x: unknown): x is WorkerEvents<typeof WORKER_JOB_START> {
  return x !== null &&
    typeof x === "object" &&
    (x as WorkerEvents<typeof WORKER_JOB_START>).event === WORKER_JOB_START &&
    isWorkerJob((x as WorkerEvents<typeof WORKER_JOB_START>).workerJob);
}

export function isWorkerJobCompleteEvent(x: unknown): x is WorkerEvents<typeof WORKER_JOB_COMPLETE> {
  return x !== null &&
    typeof x === "object" &&
    typeof (x as WorkerEvents<typeof WORKER_JOB_COMPLETE>) === "object" &&
    (x as WorkerEvents<typeof WORKER_JOB_COMPLETE>).event === WORKER_JOB_COMPLETE &&
    isWorkerJob((x as WorkerEvents<typeof WORKER_JOB_COMPLETE>).workerJob);
}

export interface WorkerJobEvent {
  workerEvent: WorkerEvent;
  jobId: string;
}
