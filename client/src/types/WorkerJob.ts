export enum WorkerJobStatus {
  PENDING = "PENDING",
  STARTED = "STARTED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  FAILED_RETRYABLE = "FAILED_RETRYABLE",
}

export interface WorkerJob {
  workerId: string | null;
  jobId: string;
  task: string;
  title: string;
  attempts: number;
  maxAttempts: number;
  status: WorkerJobStatus;
  uploadInProgress: boolean;
  uploaded: boolean;
  error: string | null;
  youTubeVideoId: string | null;
  postUploadSteps: {
    addToYouTubePlaylist: boolean;
    linkOnTheBlueAlliance: boolean;
  } | null;
}
