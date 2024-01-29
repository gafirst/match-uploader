import { getSettings } from "@src/services/SettingsService";
import { type YouTubeVideoPrivacy } from "@src/models/YouTubeVideoPrivacy";
import {
    isYouTubeVideoUploadError, isYouTubeVideoUploadInSandboxMode,
    isYouTubeVideoUploadSuccess,
} from "@src/models/YouTubeVideoUploadResult";
import { type JobHelpers } from "graphile-worker";
import { prisma } from "@src/worker";
import { handleMatchVideoPostUploadSteps, uploadYouTubeVideo } from "@src/repos/YouTubeRepo";
import MatchKey from "@src/models/MatchKey";
import { type PlayoffsType } from "@src/models/PlayoffsType";
import { isPrismaClientKnownRequestError } from "@src/util/prisma";

// This file runs on the worker, not the server. This means that functions in this file should not
// depend on anything in YouTubeService.ts or directly or indirectly depend on anything in server/src/index.ts (e.g.,
// WorkerService.ts), as this causes the Express server to run on the worker
export interface UploadVideoTaskPayload {
    title: string;
    description: string;
    videoPath: string;
    label: string;
    matchKey: string;
    playoffsType: string;
}

function assertIsUploadVideoTaskPayload(payload: unknown): asserts payload is UploadVideoTaskPayload {
    if (payload === null) {
        throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
    } else if (typeof payload === "undefined") {
        throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
    } else if (!(payload as unknown as UploadVideoTaskPayload).title ||
        !(payload as unknown as UploadVideoTaskPayload).description ||
        !(payload as unknown as UploadVideoTaskPayload).videoPath ||
        !(payload as unknown as UploadVideoTaskPayload).label ||
        !(payload as unknown as UploadVideoTaskPayload).matchKey ||
        !(payload as unknown as UploadVideoTaskPayload).playoffsType
    ) {
        throw new Error(`Invalid payload (missing required prop): ${JSON.stringify(payload)}`);
    }
}

export async function uploadVideo(payload: unknown, { logger, job }: JobHelpers): Promise<void> {
    assertIsUploadVideoTaskPayload(payload);

    const settings = await getSettings();
    const matchKeyObject = MatchKey.fromString(payload.matchKey, payload.playoffsType as PlayoffsType);
    logger.info(`Uploading video ${payload.title} for match ${matchKeyObject.matchKey}`);
    const uploadResult = await uploadYouTubeVideo(payload.title,
        payload.description,
        payload.videoPath,
        settings.youTubeVideoPrivacy as YouTubeVideoPrivacy);

    if (isYouTubeVideoUploadSuccess(uploadResult)) {
        logger.info(`Successfully uploaded video ${payload.title} with ID ${uploadResult.videoId}`);

        try {
            await prisma.workerJob.update({
                where: {
                    jobId: job.id,
                },
                data: {
                    youTubeVideoId: uploadResult.videoId,
                },
            });
        } catch (e) { // Catch the prisma update error
            if (isPrismaClientKnownRequestError(e, "P2025")) {
                logger.warn(`Unable to attach YouTube video with ID ${uploadResult.videoId} to job with ID ` +
                  `${job.id}: Job does not exist in match-uploader WorkerJob table`);
            } else {
                logger.warn(`Unable to attach YouTube video with ID ${uploadResult.videoId} to job with ID ` +
                  `${job.id}: ${JSON.stringify(e)}`);
            }
        }

        const postUploadStepsResult =
            await handleMatchVideoPostUploadSteps(uploadResult.videoId, payload.label, matchKeyObject);

        try {
            await prisma.workerJob.update({
                where: {
                    jobId: job.id,
                },
                data: {
                    addedToYouTubePlaylist: postUploadStepsResult.addToYouTubePlaylist,
                    linkedOnTheBlueAlliance: postUploadStepsResult.linkOnTheBlueAlliance,
                },
            });
        } catch (e) { // Catch the prisma update error
            if (isPrismaClientKnownRequestError(e, "P2025")) {
                logger.warn(`Unable to record post-upload step results for job with ID ${job.id}: Job does ` +
                  "not exist in match-uploader WorkerJob table");
            } else {
                logger.warn(`Unable to record post-upload step results for job with ID ${job.id}: ` +
                  `${JSON.stringify(e)}`);
            }
        }
    } else if (isYouTubeVideoUploadError(uploadResult)) {
        logger.error(`Failed to upload video ${payload.title}: ${uploadResult.error}`);
        throw new Error(uploadResult.error);
    } else if (isYouTubeVideoUploadInSandboxMode(uploadResult)) {
        logger.info(`Successfully uploaded video ${payload.title} in sandbox mode`);
        try {
            await prisma.workerJob.update({
                where: {
                    jobId: job.id,
                },
                data: {
                    addedToYouTubePlaylist: true,
                    linkedOnTheBlueAlliance: true,
                },
            });
        } catch (e) {
            if (isPrismaClientKnownRequestError(e, "P2025")) {
                logger.error(`[Sandbox mode] Unable to add fake post-upload step results for job with ID ${job.id}: ` +
                  "Job does not exist in match-uploader WorkerJob table");
            } else {
                logger.error(`[Sandbox mode]  Unable to add fake post-upload step results for job with ID ${job.id}: ` +
                  `${JSON.stringify(e)}`);
            }
        }
    } else {
        logger.error(`YouTube upload result did not parse as success or failure: ${JSON.stringify(uploadResult)}`);
        throw new Error("YouTube upload result did not parse as success or failure. Check the logs for more " +
            "info.");
    }
}
