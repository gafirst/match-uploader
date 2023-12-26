import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import { type IReq, type IRes } from "@src/routes/types/types";
import { graphileWorkerUtils, prisma } from "@src/server";
import { body, matchedData, param, validationResult } from "express-validator";
import logger from "jet-logger";
import { type JobStatus } from "@prisma/client";

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
    body("jobIds").isArray(),
    body("reason").isString(),
    permanentlyFailJobs,
);

/**
 * Marks a worker job as permanently failed, which prevents it from being run again in the future.
 * This function CANNOT operate on jobs that are locked by a worker (unless the lock is >4 hours old). If the worker
 * crashed, you must first force unlock the worker.
 * @param req
 * @param res
 */
async function permanentlyFailJobs(req: IReq, res: IRes): Promise<IRes> {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400)
            .json({
                errors: errors.array(),
            });
    }

    const { jobIds, reason } = matchedData(req);

    const [graphileResult, prismaResult] = await Promise.all([
        graphileWorkerUtils.permanentlyFailJobs(jobIds as string[], reason as string),
        prisma.workerJob.updateMany({
            where: {
                jobId: {
                    in: jobIds as string[],
                },
            },
            data: {
                status: "FAILED",
                error: reason as string,
            },
        }),
    ]);

    if (graphileResult.length !== prismaResult.count) {
        return res.json({
            success: false,
            message: "Graphile and Prisma job fail results have different lengths, so not all jobs requested were " +
                "actually cancelled.",
            prismaUpdateCount: prismaResult.count,
            graphileResult,
        });
    }

    if (graphileResult.length === 0) {
        return res.json({
            success: false,
            message: "No jobs cancelled because none of the job IDs were found in the database",
        });
    }

    if (graphileResult.length !== (jobIds as string[]).length) {
        logger.warn(
            `Graphile response indicates some jobs were not actually cancelled: ${JSON.stringify(graphileResult)}`,
        );
        return res.json({
            success: false,
            message: "Not all jobs requested were actually cancelled",
            cancelled: (jobIds as string[]).filter(
                (id: string) => graphileResult
                    .find(result => result.id === id) !== undefined),
            notCancelled: (jobIds as string[]).filter(
                (id: string) => graphileResult
                    .find(result => result.id === id) === undefined),
        });
    }

    return res.json({ success: true, updated: prismaResult.count });
}
