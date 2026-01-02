import { graphileWorkerUtils, prisma } from "@src/server";
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

export async function cancelJob(jobId: string, reason: string): Promise<void> {
  const [graphileResult, workerJob] = await Promise.all([
    graphileWorkerUtils.permanentlyFailJobs([jobId], reason),
    prisma.workerJob.update({
      where: {
        jobId,
      },
      data: {
        status: "CANCELLED",
        error: reason,
      },
    }),
  ]);

  if (graphileResult.length !== 1) {
    logger.err(`Error cancelling job with ID ${jobId}: Graphile permanent fail request did not return a job ID` +
      " (see graphileResult below)");
    logger.err(graphileResult);
    throw new Error("Graphile permanent fail request was unsuccessful (check the logs for more details)");
  }

  // Manually send the WebSocket event since the job was canceled because Graphile won't send an event in this case
  io.emit("worker", {
    event: WORKER_JOB_COMPLETE,
    workerJob,
  });
}

async function handleWorkerJobStart(data: ClientToServerEvents[typeof WORKER_JOB_START]): Promise<void> {
  // Because we're receiving websocket data from a client, we can't be 100% sure the data truly matches the typing
  if (!isWorkerJobStartEvent(data)) {
    logger.warn(`Dropping invalid worker:job:start event: ${JSON.stringify(data)}`);
    return;
  }

  try {
    await prisma.workerJob.upsert({
      where: {
        jobId: data.jobId,
      },
      update: {
        status: JobStatus.STARTED,
        error: null,
        workerId: data.workerId,
      },
      create: {
        jobId: data.jobId,
        status: JobStatus.STARTED,
        error: null,
        workerId: data.workerId,
        attempts: data.attempts,
        maxAttempts: data.maxAttempts,
        task: data.jobName,
        title: "Unknown",
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
        "be STARTED)");
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

  try {
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
  } catch (e: unknown) {
    if (isPrismaClientKnownRequestError(e, "P2025")) {
      logger.warn(`Could not update match-uploader WorkerJob table for job with ID ${data.jobId}: ` +
        "Job is not already present in the table (this is likely to cause jobs to be stuck in STARTED when they" +
        " should be in a failed or completed status)");
    } else {
      logger.warn(`Could not update match-uploader WorkerJob table for job with ID ${data.jobId}: ` +
        `${JSON.stringify(e)} (this is likely to cause jobs to be stuck in STARTED when they should ` +
        "be in a failed or completed status)");
    }
  }
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

    if (!("jobId" in data)) {
      logger.warn(
        `Error processing ${event} event: event data missing jobId key: ${JSON.stringify(data)}`,
      );
      return;
    }

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
