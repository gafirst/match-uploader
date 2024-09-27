import { JobStatus, type PrismaClient, type WorkerJob } from "@prisma/client";
import { type AddJobFunction, type TaskSpec } from "graphile-worker";
import { type Server as SocketIOServer } from "socket.io";
import { type WorkerTask } from "@src/tasks/types/tasks";
import { type Socket } from "socket.io-client";

/**
 * Queues a job and creates a WorkerJob record in the database.
 *
 * Will also emit a Socket.IO event to notify clients of the new job.
 *
 * @param prisma
 * @param addJob
 * @param io
 * @param jobSummary
 * @param taskName
 * @param payload
 * @param taskSpec
 */
export async function queueJob(
  prisma: PrismaClient,
  addJob: AddJobFunction,
  io: SocketIOServer | Socket,
  jobSummary: string,
  taskName: WorkerTask,
  payload: object,
  taskSpec: TaskSpec = {}): Promise<WorkerJob> {
  const job = await addJob(taskName, payload, taskSpec);
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
      title: jobSummary,
      workerId: null,
      error: null,
      attempts: 0,
      maxAttempts: taskSpec.maxAttempts ?? 25, // 25 is the Graphile default
    },
  });

  io.emit("worker", {
    event: "worker:job:created", // TODO: Use constant, change created->create
    workerJob: upsertResult,
  });

  return upsertResult;
}
