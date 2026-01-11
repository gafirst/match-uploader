import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import { type IReq, type IRes } from "@src/routes/types/types";
import { graphileWorkerUtils, prisma } from "@src/server";
import { body, matchedData, param, validationResult } from "express-validator";
import { JobStatus } from "@prisma/client";
import { cancelJob, triggerBackupDbJob } from "@src/services/WorkerService";
import { triggerAutoRenameJob } from "@src/services/AutoRenameService";

export const workerRouter = Router();
export const workerJobsRouter = Router();
workerRouter.use(Paths.Worker.Jobs.Base, workerJobsRouter);

workerJobsRouter.get(
    Paths.Worker.Jobs.List,
    param("statuses").default(["PENDING", "STARTED", "FAILED_RETRYABLE"]).isArray().toUpperCase(),
    getWorkerJobs,
);

async function getWorkerJobs(req: IReq, res: IRes): Promise<IRes> {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400)
            .json({
                errors: errors.array(),
            });
    }

    const { statuses } = matchedData(req);

    const results = await prisma.workerJob.findMany({
        orderBy: { jobId: "desc" },
        select: {
            jobId: true,
            workerId: true,
            title: true,
            status: true,
            task: true,
            createdAt: true,
            updatedAt: true,
        },
        where: {
            status: {
                in: statuses as JobStatus[],
            },
        },
    });
    return res.json(results);
}

workerJobsRouter.get(
    Paths.Worker.Jobs.Stats,
    getWorkerJobStats,
);

async function getWorkerJobStats(req: IReq, res: IRes): Promise<IRes> {
    const results = await prisma.workerJob.groupBy({
        by: ["status"],
        _count: {
            status: true,
        },
    });

    return res.json(results);
}

workerRouter.post(
    Paths.Worker.ForceUnlockWorker,
    body("workerIds").isArray(),
    forceUnlockWorkers,
);

/**
 * Force unlocks a worker, which unblocks queues and jobs it had locked. This may be useful
 * to run if a worker crashes and leaves queues or jobs locked.
 *
 * @param req
 * @param res
 */
async function forceUnlockWorkers(req: IReq, res: IRes): Promise<IRes> {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400)
            .json({
                errors: errors.array(),
            });
    }

    const { workerIds } = matchedData(req);

    await graphileWorkerUtils.forceUnlockWorkers(workerIds as string[]);

    await prisma.workerJob.updateMany({
        where: {
            workerId: {
                in: workerIds as string[],
            },
        },
        data: {
            workerId: null,
        },
    });

    return res.json({ success: true });
}

workerJobsRouter.post(
    Paths.Worker.Jobs.Cancel,
    body("jobId").isString(),
    body("reason").isString(),
    permanentlyFailJob,
);

/**
 * Marks a worker job as permanently failed, which prevents it from being run again in the future.
 * This function CANNOT operate on jobs that are locked by a worker (unless the lock is >4 hours old). If the worker
 * crashed, you must first force unlock the worker.
 * @param req
 * @param res
 */
async function permanentlyFailJob(req: IReq, res: IRes): Promise<IRes> {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400)
            .json({
                errors: errors.array(),
            });
    }

    const { jobId, reason } = matchedData(req);

    const workerJob = await prisma.workerJob.findUnique({
        where: {
            jobId: jobId as string,
        },
    });

    if (!workerJob) {
        return res.status(404).json({
            success: false,
            error: `Job #${jobId} not found`,
        });
    }

    if (workerJob.status === JobStatus.PENDING || workerJob.status === JobStatus.FAILED_RETRYABLE) {
        await cancelJob(jobId as string, reason as string);
        return res.json({ success: true });
    }

    return res.status(400).json({
        success: false,
        error: `Job cannot be cancelled from ${workerJob.status} status`,
    });
}

export const workerDebugRouter = Router();
workerRouter.use(Paths.Worker.Debug.Base, workerDebugRouter);

workerDebugRouter.get(Paths.Worker.Debug.AutoRename, triggerAutoRename);

async function triggerAutoRename(req: IReq, res: IRes): Promise<IRes> {
    return res.json({
        success: true,
        workerJob: await triggerAutoRenameJob(),
    });
}

workerDebugRouter.get(Paths.Worker.Debug.BackupDb, triggerBackupDb);

async function triggerBackupDb(req: IReq, res: IRes): Promise<IRes> {
    return res.json({
        success: true,
        workerJob: await triggerBackupDbJob(),
    });
}
