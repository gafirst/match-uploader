export interface CondensedWorkerEventMap {
    "job:complete": {
        jobId: string;
        jobName: string;
        workerId: string;
        attempts: number;
        maxAttempts: number;
        error: unknown;
        success: boolean;
        payload: unknown;
    };
    "job:start": {
        jobId: string;
        jobName: string;
        workerId: string;
        payload: unknown;
    };
}

export function isWorkerJobStartEvent(data: unknown): data is CondensedWorkerEventMap["job:start"] {
    return typeof data === "object" &&
        data !== null &&
        "jobId" in data &&
        "jobName" in data &&
        "workerId" in data &&
        "payload" in data;
}

export function isWorkerJobCompleteEvent(data: unknown): data is CondensedWorkerEventMap["job:complete"] {
    return typeof data === "object" &&
        data !== null &&
        "jobId" in data &&
        "jobName" in data &&
        "workerId" in data &&
        "attempts" in data &&
        "maxAttempts" in data &&
        "error" in data &&
        "success" in data &&
        "payload" in data;
}
