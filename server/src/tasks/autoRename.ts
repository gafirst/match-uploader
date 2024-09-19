import type { JobHelpers } from "graphile-worker";
import { assertIsCronPayload, type CronPayload } from "@src/tasks/types/cronPayload";
import { getSettings } from "@src/services/SettingsService";
import { getFilesMatchingPattern } from "@src/repos/FileStorageRepo";
import { DateTime } from "luxon";
import { AutoRenameAssociationStatus } from "@prisma/client";
import { prisma } from "@src/worker";
import { type TbaMatchSimple } from "@src/models/theBlueAlliance/tbaMatchesSimpleApiResponse";
import { getMatchList } from "@src/services/MatchesService";
import { Match } from "@src/models/Match";
import MatchKey from "@src/models/MatchKey";
import { type PlayoffsType } from "@src/models/PlayoffsType";

export interface AutoRenameCronPayload {
  _cron: CronPayload;
}

function assertIsAutoRenameCronPayload(payload: unknown): asserts payload is AutoRenameCronPayload {
  if (payload === null) {
    throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
  } else if (typeof payload === "undefined") {
    throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
  }
  assertIsCronPayload((payload as unknown as AutoRenameCronPayload)._cron);
}

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

    let associationType: AutoRenameAssociationStatus | null = null;
    let closestMatch: TbaMatchSimple | null = null;
    let closestMatchDiff = Infinity;
    logger.info(`Processing ${association.filePath}`);

    for (const match of matches) {
      // logger.info("-------");
      // logger.info(`Checking match ${match.key}`);
      if (!match.actual_time || !association.videoTimestamp) {
        continue;
      }
      // logger.info(`Match start time: ${DateTime.fromSeconds(match.actual_time).toISO()}`);

      const matchDate = DateTime.fromSeconds(match.actual_time);
      const diffSeconds = Math.abs(matchDate.diff(DateTime.fromJSDate(association.videoTimestamp)).as("seconds"));
      // logger.info(`Difference: ${diffSeconds} / closest match: ${closestMatchDiff}`);
      if (diffSeconds < closestMatchDiff) {
        if (diffSeconds > 300) {
          continue;
        }
        if (diffSeconds > 60) {
          associationType = AutoRenameAssociationStatus.WEAK;
        } else {
          associationType = AutoRenameAssociationStatus.STRONG;
        }

        closestMatchDiff = diffSeconds;

        logger.info(`Match ${match.key} is within 5 minutes of the test date`);
        closestMatch = match;
      }
    }

    if (closestMatch && associationType) {
      const oldExtension = association.videoFile.split(".").pop();
      const matchKeyObj = MatchKey.fromString(closestMatch.key, playoffsType as PlayoffsType);
      logger.info(`Match key object: ${JSON.stringify(matchKeyObj)}`);
      const matchObj = new Match(matchKeyObj);
      logger.info(`Match object: ${JSON.stringify(matchObj)}`);
      const newFileName = `${matchObj.videoFileMatchingName}.${oldExtension}`;

      logger.info(`New file name: ${newFileName}`);
      // TODO: decide on delay before renames
      const renameAfter = DateTime.now().plus({ seconds: 10 });
      let renameJobId: string | undefined;

      if (associationType === AutoRenameAssociationStatus.STRONG) {
        // TODO: Need to use WorkerJob for this
        const job = await addJob("renameFile", {
            directory: `${videoSearchDirectory}/${association.videoLabel}`,
            oldFileName: association.videoFile,
            newFileName,
            associationId: association.filePath,
          },
          {
            maxAttempts: 1,
            jobKey: `autoRename-${association.filePath}`,
            jobKeyMode: "replace",
            runAt: renameAfter.toJSDate(),
          });
        renameJobId = job.id;
      }

      await prisma.autoRenameAssociation.update({
        where: {
          filePath: association.filePath,
        },
        data: {
          status: associationType,
          statusReason: `${associationType.toLowerCase()} association in job ${job.id}`,
          matchKey: closestMatch.key,
          associationAttempts: {
            increment: 1,
          },
          newFileName,
          renameAfter: renameAfter.toISO(),
          renameCompleted: false,
          isIgnored: false,
          renameJobId,
        },
      });
    } else {
      if (association.associationAttempts >= association.maxAssociationAttempts) {
        await prisma.autoRenameAssociation.update({
          where: {
            filePath: association.filePath,
          },
          data: {
            status: AutoRenameAssociationStatus.FAILED,
            statusReason: "Max attempts reached",
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
          },
        });
      }
    }
  }
}
