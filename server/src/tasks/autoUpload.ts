import type { JobHelpers } from "graphile-worker";
import { getSettings, getYouTubePlaylists } from "@src/services/SettingsService";
import { assertIsCronPayload, type CronPayload } from "@src/tasks/types/cronPayload";
import { prisma, workerIo } from "@src/worker";
import MatchKey from "@src/models/MatchKey";
import { PlayoffsType } from "@src/models/PlayoffsType";
import {
  generateMatchVideoDescription,
  getLocalVideoFilesForMatch,
  getMatch,
  getNextMatch,
  matchIsScored,
} from "@src/services/MatchesService";
import { getExpectedVideoLabels } from "@src/models/YouTubePlaylists";
import { queueYouTubeVideoUpload } from "@src/services/YouTubeService";
import { VideoType } from "@src/models/VideoType";
import { YouTubeVideoPrivacy } from "@src/models/YouTubeVideoPrivacy";
import { Match } from "@src/models/Match";
import { WorkerJob } from "@prisma/client";

export interface AutoUploadCronPayload {
  _cron: CronPayload;
  manualTrigger?: boolean;
}

function assertIsAutoRenameCronPayload(payload: unknown): asserts payload is AutoUploadCronPayload {
  if (payload === null) {
    throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
  } else if (typeof payload === "undefined") {
    throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
  }
  assertIsCronPayload((payload as unknown as AutoUploadCronPayload)._cron);
}

export async function autoUpload(payload: unknown, {
  logger,
  addJob,
}: JobHelpers): Promise<void> {
  logger.info(JSON.stringify(payload));
  assertIsAutoRenameCronPayload(payload);

  const {
    autoUploadEnabled,
    eventName,
    eventTbaCode,
    playoffsType,
    youTubeVideoPrivacy,
  } = await getSettings();

  if (!autoUploadEnabled && !payload.manualTrigger) {
    logger.info("Auto Upload is disabled, skipping");
    return;
  }

  const metadata = await prisma.autoUploadMetadata.findUnique({
    where: {
      eventKey: eventTbaCode,
    }
  });

  if (!metadata) {
    throw new Error("No Auto Upload metadata found for event; it should have been created automatically when Auto Upload was enabled, so this is probably a bug");
  }

  if (!metadata.currentMatchKey) {
    throw new Error("Current match not set for Auto Upload; it should have been set when Auto Upload was enabled, so this is probably a bug");
  }

  // FIXME: Check preconditions
  if (playoffsType !== PlayoffsType.DoubleElimination) {
    // FIXME: Disable Auto Upload and return error
    throw new Error(`Unsupported playoffs type: ${playoffsType}`);
  }

  const matchKey = MatchKey.fromString(metadata.currentMatchKey, playoffsType as PlayoffsType);

  const match = await getMatch(matchKey);

  const hasScore = matchIsScored(match);
  const videos =  await getLocalVideoFilesForMatch(matchKey, false);

  const expectedLabels = getExpectedVideoLabels(await getYouTubePlaylists());
  const actualLabels = new Set(videos.map(video => video.videoLabel?.toLowerCase() ?? "unlabeled"));
  const missingLabels = expectedLabels.difference(actualLabels);

  if (missingLabels) {
    logger.info(`Missing labels: ${JSON.stringify(Array.from(missingLabels))}`);
  }

  const triggeredJobs: WorkerJob[] = []
  if (hasScore && !missingLabels.size) {
    const description = await generateMatchVideoDescription(new Match(matchKey), eventName);

    for (const video of videos) {
      if (video.isUploaded) {
        logger.info(`Video ${video.path} has already been uploaded, skipping`);
        continue;
      }

      triggeredJobs.push(await queueYouTubeVideoUpload(
        video.videoType,
        video.videoTitle,
        description,
        video.path,
        youTubeVideoPrivacy as YouTubeVideoPrivacy,
        matchKey,
        eventTbaCode,
        video.videoLabel ?? "unlabeled",
        false,
        prisma,
        addJob,
        workerIo,
      ));
    }
  }

  const nextMatch = await getNextMatch(matchKey);

  // FIXME: Create AutoUploadEvent object and associate the videos' WorkerJobs with it (i.e., update the worker jobs)

  const result = {
    hasScore,
    missingLabels: Array.from(missingLabels),
    nextMatch,
    triggeredJobs,
  }
  logger.info(`${JSON.stringify(result)}`)
}