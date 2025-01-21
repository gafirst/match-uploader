import { uploadVideo } from "@src/tasks/uploadVideo";
import { type Runner, run } from "graphile-worker";
import logger from "jet-logger";
import { type Socket, io } from "socket.io-client";
import EnvVars from "@src/constants/EnvVars";
import { PrismaClient } from "@prisma/client";
import { autoRename } from "@src/tasks/autoRename";
import { renameFile } from "@src/tasks/renameFile";
import { AUTO_RENAME_ASSOCIATION_UPDATE } from "@src/tasks/types/events";

export const prisma = new PrismaClient().$extends({
    query: {
        autoRenameAssociation: {
            async update({ args, query }) {
                const association = await query(args);
                workerIo.emit(AUTO_RENAME_ASSOCIATION_UPDATE, {
                    filePath: association.filePath,
                    eventKey: association.eventKey,
                });
            },
            async upsert({ args, query }) {
                const association = await query(args);
                workerIo.emit(AUTO_RENAME_ASSOCIATION_UPDATE, {
                    filePath: association.filePath,
                    eventKey: association.eventKey,
                });
            },
        },
    },
});

export type WorkerPrismaClient = typeof prisma;

/**
 * Watches certain worker events and forwards them to a Socket.IO socket. Note that event
 * names are transformed to add a `worker:` prefix.
 *
 * NOTE: When adding new events, if you want clients to receive them, you must add the event type for forwarding in
 * server/src/util/ws.ts.
 *
 * @param socketClient The Socket.IO socket client
 * @param runner The graphile-worker runner
 */
function configureWorkerEvents(socketClient: Socket, runner: Runner): void {
    runner.events.on("job:start", ({ worker, job }) => {
        socketClient.emit("worker:job:start", {
            workerId: worker.workerId,
            jobId: job.id,
            jobName: job.task_identifier,
            attempts: job.attempts,
            maxAttempts: job.max_attempts,
            payload: job.payload,
        });
    });

    runner.events.on("job:complete", ({ worker, job, error }) => {
        logger.info("Job complete");

        let stringifiedError: string | null = null;

        if (error instanceof Error) {
            stringifiedError = error.toString();
        } else if (error) {
            logger.warn(`Unable to stringify error for job:complete event of job ${job.id}`);
            logger.warn(error);
        }

        socketClient.emit(`worker:job:complete`, {
            workerId: worker.workerId,
            jobId: job.id,
            jobName: job.task_identifier,
            attempts: job.attempts,
            maxAttempts: job.max_attempts,
            payload: job.payload,
            error: stringifiedError,
            success: !error,
        });
    });
}

export let workerIo: Socket;

async function main(): Promise<void> {
    // Run a worker to execute jobs:
    const runner = await run({
        connectionString: EnvVars.db.connectionString,
        concurrency: 5,
        crontabFile: EnvVars.worker.crontabFilePath,
        // Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
        noHandleSignals: false,
        pollInterval: 1000,
        taskList: {
            autoRename,
            renameFile,
            uploadVideo,
        },
    });

    const socketClient: Socket = io(EnvVars.worker.webServerUrl);
    workerIo = socketClient;
    logger.info(`Connecting to Socket.IO server at ${EnvVars.worker.webServerUrl}`);
    socketClient.on("connect_error", (error) => {
        logger.err("Socket.IO client connection error:");
        logger.err(error);
    });

    socketClient.connect();
    configureWorkerEvents(socketClient, runner);

    // Immediately await (or otherwise handled) the resulting promise, to avoid
    // "unhandled rejection" errors causing a process crash in the event of
    // something going wrong.
    await runner.promise;

    // If the worker exits (whether through fatal error or otherwise), the above
    // promise will resolve/reject.
}

main().catch((err) => {
    logger.err(err);
    throw Error("Worker exiting because an error was encountered");
});
