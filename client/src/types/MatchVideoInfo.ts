export interface MatchVideoInfo {
    path: string;
    videoLabel: string | null;
    videoTitle: string;
    skipUpload: boolean;
    workerJobId: string | null;
    jobCreationError: string | null;
    isRequestingJob: boolean;
    isUploaded: boolean;
}
