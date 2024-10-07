import type { JobHelpers } from "graphile-worker";
import { assertIsCronPayload, type CronPayload } from "@src/tasks/types/cronPayload";
import { getSettings } from "@src/services/SettingsService";
import { getFilesMatchingPattern } from "@src/repos/FileStorageRepo";
import { DateTime } from "luxon";
import { AutoRenameAssociationStatus } from "@prisma/client";
import { prisma, workerIo } from "@src/worker";
import { type TbaMatchSimple } from "@src/models/theBlueAlliance/tbaMatchesSimpleApiResponse";
import { getMatchList } from "@src/services/MatchesService";
import MatchKey from "@src/models/MatchKey";
import { type PlayoffsType } from "@src/models/PlayoffsType";
import {
  getNewFileNameForAutoRename,
  getNewFileNamePreservingExtension,
  queueRenameJob,
} from "@src/repos/AutoRenameRepo";
import { AUTO_RENAME_ASSOCIATION_UPDATE } from "@src/tasks/types/events";
import { videoDuration } from "@numairawan/video-duration";
import { Match } from "@src/models/Match";

export interface AutoRenameCronPayload {
  _cron: CronPayload;
}

function classifyAssociation(startTimeDiffSecs: number, videoDuration: number): {
  associationStatus: AutoRenameAssociationStatus;
  startTimeDiffAbnormal: boolean;
  videoDurationAbnormal: boolean;
} {
  const minVideoDuration = 3 * 60; // 3 minutes
  const maxVideoDurationStrong = 5 * 60; // 5 minutes FIXME

  const videoDurationInRange = videoDuration >= minVideoDuration && videoDuration <= maxVideoDurationStrong;

  const startTimeDiffStrong = startTimeDiffSecs <= 60;
  const startTimeDiffWeak = startTimeDiffSecs <= 300;

  let associationStatus: AutoRenameAssociationStatus = AutoRenameAssociationStatus.UNMATCHED;

  if (startTimeDiffStrong) {
    if (videoDurationInRange) {
        associationStatus = AutoRenameAssociationStatus.STRONG;
    } else {
        associationStatus = AutoRenameAssociationStatus.WEAK;
    }
  } else if (startTimeDiffWeak) {
    associationStatus = AutoRenameAssociationStatus.WEAK;
  }

    return {
      associationStatus,
      startTimeDiffAbnormal: !startTimeDiffWeak,
      videoDurationAbnormal: !videoDurationInRange,
    };
}

async function getVideoDuration(filePath: string): Promise<{ seconds: number }> {
  // eslint-disable-next-line
  return await videoDuration(filePath);
}

function assertIsAutoRenameCronPayload(payload: unknown): asserts payload is AutoRenameCronPayload {
  if (payload === null) {
    throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
  } else if (typeof payload === "undefined") {
    throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
  }
  assertIsCronPayload((payload as unknown as AutoRenameCronPayload)._cron);
}

// FIXME: Add event code checking
// FIXME: Add customizable delay before renaming
// FIXME: Add chronological order check
export async function autoRename(payload: unknown, {
  logger,
  job,
  addJob,
}: JobHelpers): Promise<void> {
  logger.info(JSON.stringify(payload));
  assertIsAutoRenameCronPayload(payload);

  const { playoffsType, videoSearchDirectory } = await getSettings();

  const files = await getFilesMatchingPattern(
    videoSearchDirectory,
    `**/*`,
    2,
    false,
  );

  for (const file of files) {
    // FIXME: needs to be more robust
    const videoLabel = file.split("/")[0];
    const videoFile = file.split("/")[1];

    const existingAssoc = await prisma.autoRenameAssociation.findUnique({
      where: {
        filePath: file,
      },
    });

    if (existingAssoc && existingAssoc.status !== AutoRenameAssociationStatus.UNMATCHED) {
      logger.info(`Skipping ${file} because it is not unmatched`);
      continue;
    }
    const parsedDate = DateTime.fromFormat(videoFile, "'Match_ - 'dd MMMM yyyy - hh-mm-ss a'.mp4'");
    logger.info(`File: ${file} / Parsed date: ${parsedDate.toISO()}`);
    if (parsedDate.isValid) {
      await prisma.autoRenameAssociation.upsert({
        where: {
          filePath: file,
        },
        create: {
          filePath: file,
          videoFile,
          videoLabel,
          status: AutoRenameAssociationStatus.UNMATCHED,
          videoTimestamp: parsedDate.toJSDate(),
        },
        update: {
          videoTimestamp: parsedDate.toJSDate(),
        },
      });
    }
  }

  const toProcess = await prisma.autoRenameAssociation.findMany(
    {
      where: {
        status: AutoRenameAssociationStatus.UNMATCHED,
      },
    },
  );

  logger.info(`Found ${toProcess.length} files to process`);

  const matches = await getMatchList();

  for (const association of toProcess) {
    // TODO: Check if file still exists

    let closestMatch: TbaMatchSimple | null = null;
    let closestMatchDiff = Infinity;
    logger.info(`Processing ${association.filePath}`);

    for (const match of matches) {
      if (!match.actual_time || !association.videoTimestamp) {
        continue;
      }

      const matchDate = DateTime.fromSeconds(match.actual_time);
      const diffSeconds = Math.abs(matchDate.diff(DateTime.fromJSDate(association.videoTimestamp)).as("seconds"));
      if (diffSeconds < closestMatchDiff) {
        if (diffSeconds > 300) {
          continue;
        }

        closestMatchDiff = diffSeconds;

        logger.info(`Match ${match.key} is within 5 minutes of the test date`);
        closestMatch = match;
      }
    }

    // FIXME: error handling?
    const videoDurationSecs = (await getVideoDuration(`${videoSearchDirectory}/${association.filePath}`)).seconds;

    const {
      associationStatus,
      startTimeDiffAbnormal,
      videoDurationAbnormal,
    } = classifyAssociation(closestMatchDiff, videoDurationSecs);
    if (closestMatch && associationStatus) {
      const matchKeyObj = MatchKey.fromString(closestMatch.key, playoffsType as PlayoffsType);
      const closestMatchObj = new Match(matchKeyObj, false);
      const newFileName = getNewFileNamePreservingExtension(
        association.videoFile,
        getNewFileNameForAutoRename(matchKeyObj, false),
      );

      // TODO: decide on delay before renames
      const renameAfter = DateTime.now().plus({ seconds: 10 });
      let renameJobId: string | undefined;

      if (associationStatus === AutoRenameAssociationStatus.STRONG) {
        const renameJob = await queueRenameJob(
          prisma,
          addJob,
          workerIo,
          association,
          videoSearchDirectory,
          renameAfter,
        );
        renameJobId = renameJob.jobId;
      }

      await prisma.autoRenameAssociation.update({
        where: {
          filePath: association.filePath,
        },
        data: {
          status: associationStatus,
          matchKey: closestMatch.key,
          matchName: closestMatchObj.matchName,
          associationAttempts: {
            increment: 1,
          },
          newFileName,
          renameJobId,
          renameAfter: renameAfter.toISO(),
          renameCompleted: false,
          videoDurationSecs,
          videoDurationAbnormal,
          startTimeDiffSecs: closestMatchDiff,
          startTimeDiffAbnormal,
        },
      });
    } else {
      console.log("inside the else");
      if (association.associationAttempts + 1 >= association.maxAssociationAttempts) {
        await prisma.autoRenameAssociation.update({
          where: {
            filePath: association.filePath,
          },
          data: {
            status: AutoRenameAssociationStatus.FAILED,
            associationAttempts: {
              increment: 1,
            },
            statusReason: "Max attempts reached",
            videoDurationSecs,
            videoDurationAbnormal,
          },
        });
      } else {
        await prisma.autoRenameAssociation.update({
          where: {
            filePath: association.filePath,
          },
          data: {
            status: AutoRenameAssociationStatus.UNMATCHED,
            associationAttempts: {
              increment: 1,
            },
            videoDurationSecs,
            videoDurationAbnormal,
          },
        });
      }
    }
  }
}
