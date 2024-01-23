import { type WorkerTask } from "@src/tasks/types/tasks";
import { graphileWorkerUtils, prisma } from "@src/server";
import { type TaskSpec } from "graphile-worker";
import { JobStatus, type WorkerJob } from "@prisma/client";
import logger from "jet-logger";
import { io } from "@src/index";
import {
    type ClientToServerEvents,
    isWorkerJobCompleteEvent,
    isWorkerJobStartEvent,
    WORKER_JOB_COMPLETE,
    WORKER_JOB_START,
} from "@src/tasks/types/events";
import { type Socket } from "socket.io";
import { isPrismaClientKnownRequestError } from "@src/util/prisma";

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
            attempts: 0,
            maxAttempts: taskSpec.maxAttempts ?? 25, // 25 is the Graphile default
        },
        update: {
            status: JobStatus.PENDING,
            workerId: null,
            error: null,
            attempts: 0,
            maxAttempts: taskSpec.maxAttempts ?? 25, // 25 is the Graphile default
        },
    });

    io.emit("worker", {
        event: "worker:job:created",
        workerJob: upsertResult,
    });

    return upsertResult;
}

async function handleWorkerJobStart(data: ClientToServerEvents[typeof WORKER_JOB_START]): Promise<void> {
    // Because we're receiving websocket data from a client, we can't be 100% sure the data truly matches the typing
    if (!isWorkerJobStartEvent(data)) {
        logger.warn(`Dropping invalid worker:job:start event: ${JSON.stringify(data)}`);
        return;
    }

    try {
        await prisma.workerJob.update({
            where: {
                jobId: data.jobId,
            },
            data: {
                status: JobStatus.STARTED,
                error: null,
                workerId: data.workerId,
            },
        });
    } catch (e: unknown) {
        if (isPrismaClientKnownRequestError(e, "P2025")) {
            logger.warn(`Could not update match-uploader WorkerJob table for job with ID ${data.jobId}: ` +
              "Job is not already present in the table (this is likely to cause jobs to be stuck in PENDING when they" +
              " should be STARTED)");
        } else {
            logger.warn(`Could not update match-uploader WorkerJob table for job with ID ${data.jobId}: ` +
              `${JSON.stringify(e)} (this is likely to cause jobs to be stuck in PENDING when they should ` +
              "should be STARTED)");
        }
    }
}

async function handleWorkerJobComplete(data: ClientToServerEvents[typeof WORKER_JOB_COMPLETE]): Promise<void> {
    // Because we're receiving websocket data from a client, we can't be certain the data matches the typing
    if (!isWorkerJobCompleteEvent(data)) {
        logger.warn(`Dropping invalid worker:job:complete event: ${JSON.stringify(data)}`);
        return;
    }

    let newStatus: JobStatus = JobStatus.COMPLETED;

    if (data.error) {
        if (data.attempts < data.maxAttempts) {
            newStatus = JobStatus.FAILED_RETRYABLE;
        } else {
            newStatus = JobStatus.FAILED;
        }
    }

    // FIXME: Catch RecordNotFound exception
    await prisma.workerJob.update({
        where: {
            jobId: data.jobId,
        },
        data: {
            status: newStatus,
            workerId: data.workerId,
            error: data.error,
            attempts: data.attempts,
            maxAttempts: data.maxAttempts,
        },
    });
}

export async function processWorkerEvent(
    event: keyof ClientToServerEvents,
    data: ClientToServerEvents[typeof event],
    socket: Socket,
): Promise<void> {
    try {
        switch (event) {
            case WORKER_JOB_START:
                await handleWorkerJobStart(data as ClientToServerEvents[typeof WORKER_JOB_START]);
                break;
            case WORKER_JOB_COMPLETE:
                await handleWorkerJobComplete(data as ClientToServerEvents[typeof WORKER_JOB_COMPLETE]);
                break;
            default:
                logger.warn(`Dropping unknown worker event: ${event}`);
                break;
        }

        let workerJob: WorkerJob | null = null;
        if (data.jobId) {
            workerJob = await prisma.workerJob.findUnique({
                where: {
                    jobId: data.jobId,
                },
            });
        }

        if (workerJob) {
            socket.broadcast.emit("worker", {
                event,
                workerJob,
            });
        } else {
            logger.warn(
                `Error processing ${event} event: could not find worker job with ID ${data.jobId}`,
            );
        }
    } catch (e) {
        logger.err(`Error handling ${event} event: ${e}`);
    }
}
