import { type WorkerTask } from "@src/tasks/types/tasks";
import { graphileWorkerUtils, prisma } from "@src/server";
import { type TaskSpec } from "graphile-worker";
import { JobStatus, type WorkerJob } from "@prisma/client";
import logger from "jet-logger";
import {
    isWorkerJobCompleteEvent,
    isWorkerJobStartEvent,
} from "@src/models/workerEvents/condensed";
import { io } from "@src/index";

/**
 * Queues a job and creates a WorkerJob record in the database.
 *
 * Will also emit a Socket.IO event to notify clients of the new job.
 *
 * @param jobSummary
 * @param taskName
 * @param payload
 * @param taskSpec
 */
export async function queueJob(jobSummary: string,
                               taskName: WorkerTask,
                               payload: object,
                               taskSpec: TaskSpec = {}): Promise<WorkerJob> {
    const job = await graphileWorkerUtils.addJob(taskName, payload, taskSpec);
    const upsertResult = await prisma.workerJob.upsert({
        where: {
            jobId: job.id,
        },
        create: {
            jobId: job.id,
            task: taskName,
            queue: taskSpec.queueName,
            payload,
            title: jobSummary,
        },
        update: {
            status: JobStatus.PENDING,
            workerId: null,
            error: null,
        },
    });

    io.emit("worker", {
        event: "worker:job:created",
        workerId: null,
        jobId: job.id,
        jobName: taskName,
        title: jobSummary,
        payload,
    });

    return upsertResult;
}

async function handleWorkerJobStart(data: unknown): Promise<void> {
    if (!isWorkerJobStartEvent(data)) {
        logger.warn(`Dropping invalid worker:job:start event: ${JSON.stringify(data)}`);
        return;
    }
    await prisma.workerJob.update({
        where: {
            jobId: data.jobId,
        },
        data: {
            status: JobStatus.STARTED,
            workerId: data.workerId,
        },
    });
}

async function handleWorkerJobComplete(data: unknown): Promise<void> {
    if (!isWorkerJobCompleteEvent(data)) {
        logger.warn(`Dropping invalid worker:job:complete event: ${JSON.stringify(data)}`);
        return;
    }

    let stringifiedError: string | null = null;
    let newStatus: JobStatus = JobStatus.COMPLETED;

    if (data.error) {
        if (data.attempts < data.maxAttempts) {
            newStatus = JobStatus.FAILED_RETRYABLE;
        } else {
            newStatus = JobStatus.FAILED;
        }

        if (typeof data.error === "string") {
            stringifiedError = data.error;
        } else if (data.error instanceof Error) {
            stringifiedError = data.error.toString();
        } else {
            logger.warn(`Unexpected error type ${typeof data.error} for worker job ${data.jobId}`);
        }
    }

    await prisma.workerJob.update({
        where: {
            jobId: data.jobId,
        },
        data: {
            status: newStatus,
            workerId: data.workerId,
            error: stringifiedError,
        },
    });
}

export async function processWorkerEvent(event: string, data: unknown): Promise<void> {
    try {
        switch (event) {
            case "worker:job:start":
                await handleWorkerJobStart(data);
                break;
            case "worker:job:complete":
                await handleWorkerJobComplete(data);
                break;
            default:
                logger.warn(`Dropping unknown worker event: ${event}`);
                break;
        }
    } catch (e) {
        logger.err(`Error handling ${event} event: ${e}`);
    }
}
