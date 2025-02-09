import type { JobHelpers, Logger } from "graphile-worker";
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
import { videoDuration } from "@numairawan/video-duration";
import { Match } from "@src/models/Match";
import fs from "fs-extra";

export interface AutoRenameCronPayload {
  _cron: CronPayload;
  manualTrigger?: boolean;
}

const MAX_VIDEO_SIZE_BYTES_FOR_DURATION = Math.pow(2, 31) - 1;

function classifyAssociation(startTimeDiffSecs: number,
  videoDuration: number,
  maxStartTimeDiffSecStrong: number,
  maxStartTimeDiffSecWeak: number,
  minExpectedVideoDurationSecs: number,
  maxExpectedVideoDurationSecs: number,
): {
  associationStatus: AutoRenameAssociationStatus;
  startTimeDiffAbnormal: boolean;
  videoDurationAbnormal: boolean;
} {
  const videoDurationInRange = videoDuration >= minExpectedVideoDurationSecs &&
    videoDuration <= maxExpectedVideoDurationSecs;

  const startTimeDiffStrong = startTimeDiffSecs <= maxStartTimeDiffSecStrong;
  const startTimeDiffWeak = startTimeDiffSecs <= maxStartTimeDiffSecWeak;

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

async function checkMatchOrdering(eventKey: string,
  videoLabel: string,
  proposedMatch: Match,
  playoffsType: PlayoffsType): Promise<{
  hasOrderingIssue: boolean;
  orderingIssueMatch: Match | null;
}> {
  const metadata = await prisma.autoRenameMetadata.findUnique({
    where: {
      id: {
        label: videoLabel, // TODO: Video label should be case sensitive
        eventKey,
      },
    },
  });

  if (!metadata?.lastStrongAssociationMatchKey) {
    return {
      hasOrderingIssue: false,
      orderingIssueMatch: null,
    };
  }

  const storedMatch = new Match(MatchKey.fromString(metadata.lastStrongAssociationMatchKey, playoffsType));
  if (proposedMatch.isAfter(storedMatch)) {
    return {
      hasOrderingIssue: false,
      orderingIssueMatch: null,
    };
  }

  return {
    hasOrderingIssue: true,
    orderingIssueMatch: storedMatch,
  };
}

async function getVideoDuration(logger: Logger, filePath: string): Promise<{ seconds: number } | { fileTooLarge: boolean }> {
  const videoFileSizeBytes = (await fs.stat(filePath)).size;

  if (videoFileSizeBytes > MAX_VIDEO_SIZE_BYTES_FOR_DURATION) {
    logger.warn(`Video file ${filePath} size (${videoFileSizeBytes}B) is too large to calculate duration`);
    return {
      fileTooLarge: true,
    }
  }

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

function parseDateFromFileName(fileName: string, patterns: string[]): DateTime | null {
  let parsedDate: DateTime;
  for (const pattern of patterns) {
    parsedDate = DateTime.fromFormat(fileName, pattern);
    if (parsedDate.isValid) {
      return parsedDate;
    }
  }

  return null;
}

export async function autoRename(payload: unknown, {
  logger,
  addJob,
}: JobHelpers): Promise<void> {
  logger.info(JSON.stringify(payload));
  assertIsAutoRenameCronPayload(payload);

  const {
    autoRenameEnabled,
    autoRenameFileNamePatterns,
    autoRenameFileRenameJobDelaySecs,
    autoRenameMaxStartTimeDiffSecStrong,
    autoRenameMaxStartTimeDiffSecWeak,
    autoRenameMinExpectedVideoDurationSecs,
    autoRenameMaxExpectedVideoDurationSecs,
    eventTbaCode,
    playoffsType,
    videoSearchDirectory,
  } = await getSettings();

  if (!autoRenameEnabled && !payload.manualTrigger) {
    logger.info("Auto-rename is disabled, skipping");
    return;
  }

  const files = await getFilesMatchingPattern(
    videoSearchDirectory,
    `**/*`,
    2,
    false,
  );

  for (const file of files) {
    // TODO: needs to be more robust
    const videoLabel = file.split("/")[0];
    const videoFile = file.split("/")[1];

    const existingAssoc = await prisma.autoRenameAssociation.findUnique({
      where: {
        id: {
          filePath: file,
          eventKey: eventTbaCode,
        },
      },
    });

    if (existingAssoc && existingAssoc.status !== AutoRenameAssociationStatus.UNMATCHED) {
      logger.info(`Skipping ${file} because it is not unmatched`);
      continue;
    }

    const isRenamedFile = (await prisma.autoRenameAssociation.count({
      where: {
        newFileName: videoFile,
        videoLabel,
      },
    })) > 0;

    if (isRenamedFile) {
      logger.info(`Skipping ${file} because it is a renamed file`);
      continue;
    }

    const parsedDate = parseDateFromFileName(videoFile, autoRenameFileNamePatterns.split(","));

    if (parsedDate && parsedDate.isValid) {
      logger.info(`File: ${file} / Parsed date: ${parsedDate.toISO()}`);
      await prisma.autoRenameAssociation.upsert({
        where: {
          id: {
            filePath: file,
            eventKey: eventTbaCode,
          }
        },
        create: {
          eventKey: eventTbaCode,
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
    } else {
      await prisma.autoRenameAssociation.upsert({
        where: {
          id: {
            filePath: file,
            eventKey: eventTbaCode,
          }
        },
        create: {
          eventKey: eventTbaCode,
          filePath: file,
          videoFile,
          videoLabel,
          status: AutoRenameAssociationStatus.FAILED,
          statusReason: "Unable to parse date from file name",
        },
        update: {},
      });
    }
  }

  // Make sure we get the associations to consider in chronological order from oldest to newest to preserve ordering
  const toProcess = await prisma.autoRenameAssociation.findMany(
    {
      where: {
        status: AutoRenameAssociationStatus.UNMATCHED,
      },
      orderBy: {
        videoTimestamp: "asc",
      },
    },
  );

  logger.info(`Found ${toProcess.length} files to process`);

  const matches = await getMatchList();

  for (const association of toProcess) {
    if (!(await fs.exists(`${videoSearchDirectory}/${association.filePath}`))) {
      await prisma.autoRenameAssociation.update({
        where: {
          id: {
            eventKey: eventTbaCode,
            filePath: association.filePath,
          },
        },
        data: {
          status: AutoRenameAssociationStatus.FAILED,
          statusReason: "File no longer exists",
        },
      });
      continue;
    }

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
        closestMatchDiff = diffSeconds;
        closestMatch = match;
      }
    }

    let videoDurationSecs = Number.MAX_SAFE_INTEGER;

    try {
      const videoDuration = await getVideoDuration(logger, `${videoSearchDirectory}/${association.filePath}`);
      if ("fileTooLarge" in videoDuration) {
        videoDurationSecs = Infinity;
      } else {
        videoDurationSecs = videoDuration.seconds;
      }
    } catch (e: unknown) {
      videoDurationSecs = Infinity;
      logger.error(`Error getting video duration for ${association.filePath}: ${e}`);
    }
    let {
      associationStatus,
      // eslint-disable-next-line prefer-const
      startTimeDiffAbnormal,
      // eslint-disable-next-line prefer-const
      videoDurationAbnormal,
    } = classifyAssociation(
      closestMatchDiff,
      videoDurationSecs,
      Number.parseInt(autoRenameMaxStartTimeDiffSecStrong, 10),
      Number.parseInt(autoRenameMaxStartTimeDiffSecWeak, 10),
      Number.parseInt(autoRenameMinExpectedVideoDurationSecs, 10),
      Number.parseInt(autoRenameMaxExpectedVideoDurationSecs, 10),
    );
    if (closestMatch &&
      associationStatus &&
      ([AutoRenameAssociationStatus.STRONG, AutoRenameAssociationStatus.WEAK] as AutoRenameAssociationStatus[])
        .includes(associationStatus)
    ) {
      const matchKeyObj = MatchKey.fromString(closestMatch.key, playoffsType as PlayoffsType);
      const closestMatchObj = new Match(matchKeyObj, false);

      const orderingCheckResult = await checkMatchOrdering(
        eventTbaCode,
        association.videoLabel,
        closestMatchObj,
        playoffsType as PlayoffsType,
      );

      logger.info(`Ordering check result: ${JSON.stringify(orderingCheckResult)}`);

      // Downgrade the association status from STRONG to WEAK if there is an ordering issue
      if (associationStatus === AutoRenameAssociationStatus.STRONG) {
        if (orderingCheckResult.hasOrderingIssue) {
          associationStatus = AutoRenameAssociationStatus.WEAK;
        } else {
          await prisma.autoRenameMetadata.upsert({
            where: {
              id: {
                label: association.videoLabel,
                eventKey: eventTbaCode,
              },
            },
            create: {
              label: association.videoLabel,
              eventKey: eventTbaCode,
              lastStrongAssociationMatchKey: closestMatch.key,
              lastStrongAssociationMatchName: closestMatchObj.matchName,
            },
            update: {
              lastStrongAssociationMatchKey: closestMatch.key,
              lastStrongAssociationMatchName: closestMatchObj.matchName,
            },
          });
        }
      }

      const newFileName = getNewFileNamePreservingExtension(
        association.videoFile,
        getNewFileNameForAutoRename(matchKeyObj, false),
      );

      const renameAfter = DateTime.now().plus({
        seconds: Number.parseInt(autoRenameFileRenameJobDelaySecs, 10), // TODO: Better type checking here
      });
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
          id: {
            eventKey: eventTbaCode,
            filePath: association.filePath,
          },
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
          orderingIssueMatchKey: orderingCheckResult.orderingIssueMatch?.key.matchKey,
          orderingIssueMatchName: orderingCheckResult.orderingIssueMatch?.matchName,
        },
      });
    } else {
      if (association.associationAttempts + 1 >= association.maxAssociationAttempts) {
        await prisma.autoRenameAssociation.update({
          where: {
            id: {
              eventKey: eventTbaCode,
              filePath: association.filePath,
            }
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
            id: {
              eventKey: eventTbaCode,
              filePath: association.filePath,
            }
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
