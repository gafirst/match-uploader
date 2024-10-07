import { graphileWorkerUtils, prisma } from "@src/server";
import { type AutoRenameAssociation, AutoRenameAssociationStatus } from "@prisma/client";
import logger from "jet-logger";
import {
  AUTO_RENAME_ASSOCIATION_UPDATE,
  type ClientToServerEvents,
  isAutoRenameAssociationUpdateEvent,
} from "@src/tasks/types/events";
import type { Socket } from "socket.io";
import { io } from "@src/index";
import {
  getNewFileNameForAutoRename,
  getNewFileNamePreservingExtension,
  queueRenameJob,
} from "@src/repos/AutoRenameRepo";
import { getSettings } from "@src/services/SettingsService";
import { DateTime } from "luxon";
import MatchKey from "@src/models/MatchKey";
import { type PlayoffsType } from "@src/models/PlayoffsType";
import { Match } from "@src/models/Match";

export async function updateAssociationData(
  videoLabel: string, filePath: string, matchKey: string | null = null,
): Promise<string | undefined> {
  const { playoffsType, videoSearchDirectory } = await getSettings();
  const existingAssociation = await prisma.autoRenameAssociation.findFirst({
    where: {
      videoLabel,
      filePath,
    },
  });

  if (!existingAssociation) {
    return `An association with the video label "${videoLabel}" and file path "${filePath}" does not exist`;
  }

  if (existingAssociation.status === AutoRenameAssociationStatus.IGNORED) {
    return "Cannot update ignored association";
  }

  if (existingAssociation.renameCompleted) {
    return "Cannot modify association because the associated video file has already been renamed";
  }

  if (existingAssociation.status === AutoRenameAssociationStatus.STRONG &&
    (!matchKey || existingAssociation.matchKey === matchKey)
  ) {
    logger.info(`Not updating association (${videoLabel}, ${filePath}) because its status is already STRONG, and the` +
      "match key is not changing");
    return;
  }

  const extraUpdateProps: { matchKey?: string; matchName?: string } = {};

  let matchKeyObj: MatchKey | null = null;
  if (!matchKey && !existingAssociation.matchKey) {
    return "Cannot confirm association because it wouldn't have a match key";
  }

  if (matchKey) {
    extraUpdateProps.matchKey = matchKey;
    const match = new Match(MatchKey.fromString(matchKey, playoffsType as PlayoffsType));
    extraUpdateProps.matchName = match.matchName;
    matchKeyObj = MatchKey.fromString(matchKey, playoffsType as PlayoffsType);
  } else if (existingAssociation.matchKey) {
    matchKeyObj = MatchKey.fromString(existingAssociation.matchKey, playoffsType as PlayoffsType);
  } else {
    return "Cannot confirm association because it wouldn't have a match key";
  }

  const newFileName = getNewFileNamePreservingExtension(
    existingAssociation.videoFile,
    getNewFileNameForAutoRename(matchKeyObj, false),
  );

  const renameAfter = DateTime.now().plus({ seconds: 10 }); // FIXME: decide on delay before renames
  const renameJob = await queueRenameJob(
    prisma,
    graphileWorkerUtils.addJob,
    io,
    existingAssociation,
    videoSearchDirectory,
    renameAfter,
  );
  const association = await prisma.autoRenameAssociation.update({
    where: {
      videoLabel,
      filePath,
    },
    data: {
      status: AutoRenameAssociationStatus.STRONG,
      statusReason: `Weak association approved at ${new Date().toISOString()}`,
      newFileName,
      renameJobId: renameJob.jobId,
      renameAfter: renameAfter.toJSDate(),
      ...extraUpdateProps,
    },
  });
  io.emit("autorename", {
    event: AUTO_RENAME_ASSOCIATION_UPDATE,
    association,
  });
}

export async function markAssociationIgnored(videoLabel: string, filePath: string): Promise<string | undefined> {
  const existingAssociation = await prisma.autoRenameAssociation.findFirst({
    where: {
      videoLabel,
      filePath,
    },
  });

  if (!existingAssociation) {
    return `An association with the video label "${videoLabel}" and file path "${filePath}" does not exist`;
  }

  if (existingAssociation.renameJobId) {
    await graphileWorkerUtils
      .permanentlyFailJobs([existingAssociation.renameJobId], "Association was manually ignored");
  }

 const association = await prisma.autoRenameAssociation.update({
    where: {
      videoLabel,
      filePath,
    },
    data: {
      status: AutoRenameAssociationStatus.IGNORED,
      renameJobId: null,
      renameCompleted: false,
      renameAfter: null,
    },
  });
  io.emit("autorename", {
    event: AUTO_RENAME_ASSOCIATION_UPDATE,
    association,
  });
}

export async function processAutoRenameEvent(
  event: keyof ClientToServerEvents,
  data: ClientToServerEvents[typeof event],
  socket: Socket,
): Promise<void> {
  try {
    if (!isAutoRenameAssociationUpdateEvent(data)) {
        logger.warn(`Dropping invalid autorename:association:update event: ${JSON.stringify(data)}`);
        return;
    }

    const association: AutoRenameAssociation = await prisma.autoRenameAssociation.findUniqueOrThrow({
        where: {
            filePath: data.filePath,
        },
    });

    socket.broadcast.emit("autorename", {
      event,
      association,
    });
  } catch (e) {
    logger.err(`Error handling ${event} event: ${e}`);
  }
}
