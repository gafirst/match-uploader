import type { JobHelpers } from "graphile-worker";
import { getSettings, getYouTubePlaylists } from "@src/services/SettingsService";
import { assertIsCronPayload, type CronPayload } from "@src/tasks/types/cronPayload";
import { prisma, workerIo } from "@src/worker";
import MatchKey from "@src/models/MatchKey";
import { PlayoffsType } from "@src/models/PlayoffsType";
import { getLocalVideoFilesForMatch, getMatch, matchIsScored } from "@src/services/MatchesService";
import { getExpectedVideoLabels } from "@src/models/YouTubePlaylists";
import { queueYouTubeVideoUpload } from "@src/services/YouTubeService";
import { VideoType } from "@src/models/VideoType";

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
    eventTbaCode,
    playoffsType
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

  const matchKey = MatchKey.fromString(metadata.currentMatchKey, playoffsType as PlayoffsType);

  const match = await getMatch(matchKey);

  const hasScore = matchIsScored(match);
  const videos =  await getLocalVideoFilesForMatch(matchKey, false);

  const playlists = await getYouTubePlaylists();
  const expectedLabels = getExpectedVideoLabels(await getYouTubePlaylists());
  const actualLabels = new Set(videos.map(video => video.videoLabel?.toLowerCase() ?? "unlabeled"));
  const missingLabels = expectedLabels.difference(actualLabels);

  if (missingLabels) {
    logger.info(`Missing labels: ${JSON.stringify(Array.from(missingLabels))}`);
  }

  // FIXME: handle partially uploaded match

  if (hasScore && !missingLabels.size) {
    await queueYouTubeVideoUpload(
      videos[0].videoType,
      videos[0].videoTitle,
      "FIXME",
      videos[0].path,
      "private", // FIXME
      matchKey,
      eventTbaCode,
      videos[0].videoLabel ?? "unlabeled",
      false,
      prisma,
      addJob,
      workerIo,
    )
  }

  const result = {
    hasScore,
    missingLabels: Array.from(missingLabels),
  }
  logger.info(`${JSON.stringify(result)}`)
}