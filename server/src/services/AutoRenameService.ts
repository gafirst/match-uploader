import { graphileWorkerUtils, prisma } from "@src/server";
import { type AutoRenameAssociation, AutoRenameAssociationStatus } from "@prisma/client";
import logger from "jet-logger";
import { type ClientToServerEvents, isAutoRenameAssociationUpdateEvent } from "@src/tasks/types/events";
import type { Socket } from "socket.io";

export async function updateAssociationData(
  videoLabel: string, filePath: string, matchKey: string | null = null,
): Promise<string | undefined> {
  const existingAssociation = await prisma.autoRenameAssociation.findFirst({
    where: {
      videoLabel,
      filePath,
    },
  });

  if (!existingAssociation) {
    return `An association with the video label "${videoLabel}" and file path "${filePath}" does not exist`;
  }

  if (existingAssociation.isIgnored) {
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

  const extraUpdateProps: { matchKey?: string | null } = {};

  if (matchKey) {
    extraUpdateProps.matchKey = matchKey;
  }

  if (!matchKey && !existingAssociation.matchKey) {
    return "Cannot confirm association because it wouldn't have a match key";
  }

  await prisma.autoRenameAssociation.update({
    where: {
      videoLabel,
      filePath,
    },
    data: {
      status: AutoRenameAssociationStatus.STRONG,
      statusReason: `Manually approved at ${new Date().toISOString()}`,
      ...extraUpdateProps,
    },
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

 await prisma.autoRenameAssociation.update({
    where: {
      videoLabel,
      filePath,
    },
    data: {
      isIgnored: true,
      status: AutoRenameAssociationStatus.FAILED,
      statusReason: `Manually ignored at ${new Date().toISOString()}`,
      renameJobId: null,
      renameCompleted: false,
      renameAfter: null,
    },
  });
}

export async function processAutoRenameEvent(
  event: keyof ClientToServerEvents,
  data: ClientToServerEvents[typeof event],
  socket: Socket,
): Promise<void> {
  try {
    logger.info("1");
    if (!isAutoRenameAssociationUpdateEvent(data)) {
        logger.warn(`Dropping invalid autorename:association:update event: ${JSON.stringify(data)}`);
        return;
    }
    logger.info("2");

    const association: AutoRenameAssociation = await prisma.autoRenameAssociation.findUniqueOrThrow({
        where: {
            filePath: data.filePath,
        },
    });
    console.log(event, association);

    socket.broadcast.emit("autorename", {
      event,
      association,
    });
    logger.info("4");
  } catch (e) {
    logger.info("5");

    logger.err(`Error handling ${event} event: ${e}`);
  }
}
