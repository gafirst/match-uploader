import { queueJob } from "@src/util/queueJob";
import { graphileWorkerUtils, prisma } from "@src/server";
import { io } from "@src/index";
import { getSettings, setSetting } from "@src/services/SettingsService";
import { PlayoffsType } from "@src/models/PlayoffsType";
import MatchKey from "@src/models/MatchKey";
import { EnableAutoUploadResponse } from "@src/models/AutoUpload";
import { Match } from "@src/models/Match";

// FIXME: Reference this from AutoUpload task
export async function getUnmetAutoUploadPrereqs(proposedMatchKey: MatchKey): Promise<string[]> {
  const {
    eventTbaCode,
    playoffsType,
  } = await getSettings();

  const result: string[] = [];

  if (playoffsType !== PlayoffsType.DoubleElimination) {
    result.push("Playoffs type must be double elimination")
  }

  if (proposedMatchKey.eventKey !== eventTbaCode) {
    result.push("Starting match key must be part of currently selected event");
  }

  // FIXME: Add remaining preconditions here

  return result;
}

export async function enableAutoUpload(startingMatchKey: MatchKey): Promise<EnableAutoUploadResponse> {
  const {
    autoUploadEnabled,
    eventTbaCode,
    playoffsType,
  } = await getSettings();

  if (autoUploadEnabled) {
    return {
      enabled: true
    }
  }

  const unmetPrereqs = await getUnmetAutoUploadPrereqs(startingMatchKey);
  const startingMatchObj = new Match(MatchKey.fromString(startingMatchKey.matchKey, playoffsType as PlayoffsType));

  const commonProps = {
    currentMatchKey: startingMatchKey.matchKey,
    currentMatchName: startingMatchObj.matchName,
  }

  if (!unmetPrereqs.length) {
    await prisma.autoUploadMetadata.upsert({
      where: {
        eventKey: eventTbaCode,
      },
      create: {
        eventKey: eventTbaCode,
        ...commonProps,
      },
      update: commonProps,
    })

    await setSetting("autoUploadEnabled", "true");

    return {
      enabled: true,
    }
  }

  return {
    enabled: false,
    unmetPrereqs,
  };
}

/**
 * Queue an autoUpload job to run immediately.
 *
 * Note: Only one manually-triggered autoUpload job can be triggered at a time
 */
export async function triggerAutoUploadJob() {
  return await queueJob(
    prisma,
    graphileWorkerUtils.addJob,
    io,
    "Manual trigger",
    "autoUpload",
    {
      _cron: {
        ts: new Date().toISOString(),
        backfill: false,
      },
      manualTrigger: true,
    },
    {
      maxAttempts: 1,
      jobKey: "autoUpload-manual-trigger",
    },
  );
}