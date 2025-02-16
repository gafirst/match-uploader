import { getSettings } from "@src/services/SettingsService";
import { type YouTubeVideoPrivacy } from "@src/models/YouTubeVideoPrivacy";
import {
  isYouTubeVideoUploadError,
  isYouTubeVideoUploadInSandboxMode,
  isYouTubeVideoUploadSuccess,
} from "@src/models/YouTubeVideoUploadResult";
import { type JobHelpers, type Logger } from "graphile-worker";
import { prisma } from "@src/worker";
import { handleMatchVideoPostUploadSteps, uploadYouTubeVideo } from "@src/repos/YouTubeRepo";
import MatchKey from "@src/models/MatchKey";
import { type PlayoffsType } from "@src/models/PlayoffsType";
import { isPrismaClientKnownRequestError } from "@src/util/prisma";
import path from "path";
import fs from "fs-extra";
import { VideoType } from "@src/models/VideoType";

// This file runs on the worker, not the server. This means that functions in this file should not
// depend on anything in YouTubeService.ts or directly or indirectly depend on anything in server/src/index.ts (e.g.,
// WorkerService.ts), as this causes the Express server to run on the worker
export interface UploadVideoTaskPayload {
  videoType: VideoType;
  title: string;
  description: string;
  videoPath: string;
  label: string;
  matchKey: string;
  playoffsType: string;
  eventKey: string;
}

function assertIsUploadVideoTaskPayload(payload: unknown): asserts payload is UploadVideoTaskPayload {
  if (payload === null) {
    throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
  } else if (typeof payload === "undefined") {
    throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
  } else if (!(payload as unknown as UploadVideoTaskPayload).title ||
    !(payload as unknown as UploadVideoTaskPayload).videoType ||
    !(payload as unknown as UploadVideoTaskPayload).description ||
    !(payload as unknown as UploadVideoTaskPayload).videoPath ||
    !(payload as unknown as UploadVideoTaskPayload).label ||
    ((payload as UploadVideoTaskPayload).videoType === VideoType.MatchVideo &&
      (!(payload as unknown as UploadVideoTaskPayload).matchKey ||
        !(payload as unknown as UploadVideoTaskPayload).playoffsType
      )) ||
    ((payload as UploadVideoTaskPayload).videoType === VideoType.EventMedia &&
        !(payload as unknown as UploadVideoTaskPayload).eventKey)
  ) {
    throw new Error(`Invalid payload (missing required prop): ${JSON.stringify(payload)}`);
  }
}

/**
 * Moves a video file from the videos directory to the uploaded directory
 *
 * @param logger
 * @param videosDirectory The directory where videos are stored
 * @param videoPath The path to the video file within the videos directory
 * @param dryRun When true, just prints the from/to paths instead of moving the file
 */
async function moveToUploadedDirectory(
  logger: Logger,
  videosDirectory: string,
  videoPath: string,
  dryRun: boolean = false,
): Promise<void> {
  // Paths should be like "$label/video.ext" (this is separate from the video search directory)
  // New path would be "$label/uploaded/video.ext"
  const fromPath = path.join(videosDirectory, videoPath);
  const splitPath = videoPath.split("/");
  const toPath = path.join(videosDirectory, splitPath[0], "uploaded", splitPath[1]);

  if (dryRun) {
    logger.info(`[Sandbox mode] Would have moved video file ${fromPath} to uploaded directory ${toPath}`);
    return;
  }

  return await fs.move(fromPath, toPath);
}

/**
 * Checks if a video path is allowed to be uploaded
 * @param videoPath The path to the video file
 */
function isAllowedUploadPath(videoPath: string): boolean {
  return !videoPath.includes("uploaded");
}

export async function uploadVideo(payload: unknown, {
  logger,
  job,
}: JobHelpers): Promise<void> {
  assertIsUploadVideoTaskPayload(payload);

  if (!isAllowedUploadPath(payload.videoPath)) {
    throw new Error(`Video path ${payload.videoPath} may not be uploaded`);
  }

  const settings = await getSettings();
  let matchKeyObject: MatchKey | null = null;

  if (payload.videoType === VideoType.MatchVideo) {
    matchKeyObject = MatchKey.fromString(payload.matchKey, payload.playoffsType as PlayoffsType);
  }
  logger.info(`Uploading video ${payload.title} for match ${matchKeyObject?.matchKey ?? "n/a"}`);
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
    } catch (e: unknown) { // Catch the prisma update error
      if (isPrismaClientKnownRequestError(e, "P2025")) {
        logger.warn(`Unable to attach YouTube video with ID ${uploadResult.videoId} to job with ID ` +
          `${job.id}: Job does not exist in match-uploader WorkerJob table`);
      } else {
        logger.warn(`Unable to attach YouTube video with ID ${uploadResult.videoId} to job with ID ` +
          `${job.id}: ${JSON.stringify(e)}`);
      }
    }

    try {
      if (matchKeyObject) {
        await prisma.uploadedVideo.create({
          data: {
            matchKey: matchKeyObject.matchKey,
            eventKey: matchKeyObject.eventKey,
            filePath: payload.videoPath,
            label: payload.label,
            youTubeVideoId: uploadResult.videoId,
            workerJobId: job.id,
          },
        });
      }
    } catch (e: unknown) {
      logger.error(`Unable to save UploadedVideo ${payload.videoPath} with YouTube ID ` +
        `${uploadResult.videoId}: ${JSON.stringify(e)}`);
    }

    try {
      await moveToUploadedDirectory(logger, settings.videoSearchDirectory, payload.videoPath);
    } catch (e: unknown) {
      logger.error(`Unable to move video file ${payload.videoPath} to uploaded directory: ${JSON.stringify(e)}`);
    }

    const postUploadStepsResult =
      await handleMatchVideoPostUploadSteps(payload.videoType, uploadResult.videoId, payload.label, matchKeyObject, payload.eventKey);

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
    } catch (e: unknown) {
      if (isPrismaClientKnownRequestError(e, "P2025")) {
        logger.warn(`Unable to record post-upload step results for job with ID ${job.id}: Job does ` +
          "not exist in match-uploader WorkerJob table");
      } else {
        logger.warn(`Unable to record post-upload step results for job with ID ${job.id}: ` +
          `${JSON.stringify(e)}`);
      }
    }

    try {
      if (matchKeyObject) {
        await prisma.uploadedVideo.update({
          where: {
            youTubeVideoId: uploadResult.videoId,
          },
          data: {
            linkOnTheBlueAllianceSucceeded: postUploadStepsResult.linkOnTheBlueAlliance,
            addToYouTubePlaylistSucceeded: postUploadStepsResult.addToYouTubePlaylist,
          },
        });
      }
    } catch (e: unknown) {
      logger.error(`Unable to update UploadedVideo ${payload.videoPath} with YouTube ID ` +
        `${uploadResult.videoId}: ${JSON.stringify(e)}`);
    }
  } else if (isYouTubeVideoUploadError(uploadResult)) {
    logger.error(`Failed to upload video ${payload.title}: ${uploadResult.error}`);
    throw new Error(uploadResult.error);
  } else if (isYouTubeVideoUploadInSandboxMode(uploadResult)) {
    logger.info(`Successfully uploaded video ${payload.title} in sandbox mode`);

    await moveToUploadedDirectory(logger, settings.videoSearchDirectory, payload.videoPath, true);

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
