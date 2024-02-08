export const WORKER_JOB_START = "worker:job:start";
export const WORKER_JOB_COMPLETE = "worker:job:complete";

export interface CommonEvents {
    [WORKER_JOB_START]: {
        workerId: string;
        jobId: string;
        jobName: string;
        attempts: number,
        maxAttempts: number,
        payload: unknown;
    };
    [WORKER_JOB_COMPLETE]: {
        workerId: string | null,
        jobId: string,
        attempts: number,
        maxAttempts: number,
        payload: unknown,
        error: string,
        success: boolean,
    }
}

export interface ServerToClientEvents {
    worker: {
        event: keyof CommonEvents;
        data: CommonEvents[keyof CommonEvents];
    };
}
export interface ClientToServerEvents extends CommonEvents {}

export function isWorkerJobStartEvent(x: unknown): x is CommonEvents[typeof WORKER_JOB_START] {
    return typeof x === "object" &&
        x !== null &&
        "workerId" in x &&
        "jobId" in x &&
        "jobName" in x &&
        "payload" in x &&
        "attempts" in x &&
        "maxAttempts" in x;
}

export function isWorkerJobCompleteEvent(x: unknown): x is CommonEvents[typeof WORKER_JOB_COMPLETE] {
    return typeof x === "object" &&
        x !== null &&
        "jobId" in x &&
        "attempts" in x &&
        "maxAttempts" in x &&
        "payload" in x &&
        "error" in x &&
        "success" in x;
}
