import type { JobHelpers } from "graphile-worker";
import fs from "fs-extra";
import { prisma, workerIo } from "@src/worker";
import { AUTO_RENAME_ASSOCIATION_UPDATE } from "@src/tasks/types/events";

export interface RenameFilePayload {
  directory: string;
  oldFileName: string;
  associationId: {
    eventKey: string;
    filePath: string;
  };
}

function assertIsRenameFilePayload(payload: unknown): asserts payload is RenameFilePayload {
  if (payload === null) {
    throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
  } else if (typeof payload === "undefined") {
    throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
  } else if (typeof (payload as RenameFilePayload).directory !== "string" ||
    typeof (payload as RenameFilePayload).oldFileName !== "string" ||
    typeof (payload as RenameFilePayload).associationId !== "object" ||
    typeof (payload as RenameFilePayload).associationId.eventKey !== "string" ||
    typeof (payload as RenameFilePayload).associationId.filePath !== "string"
  ) {
    throw new Error(`Invalid payload (missing or invalid required prop): ${JSON.stringify(payload)}`);
  }
}

export async function renameFile(payload: unknown, {
  logger,
}: JobHelpers): Promise<void> {
  logger.info(JSON.stringify(payload));
  assertIsRenameFilePayload(payload);

  const association = await prisma.autoRenameAssociation.findUniqueOrThrow({
    where: {
      id: payload.associationId,
    },
  });

  if (!association.newFileName) {
    throw new Error(`Association ${association.filePath} does not have a new file name`);
  }

  const renameFrom = `${payload.directory}/${payload.oldFileName}`;
  const renameTo = `${payload.directory}/${association.newFileName}`;

  if (await fs.exists(renameTo)) {
    throw new Error(`File name to rename to (${renameTo}) already exists`);
  }

  logger.info(`Renaming ${renameFrom} to ${renameTo}`);

  // Rename the file
  await fs.rename(renameFrom, renameTo);

  await prisma.autoRenameAssociation.update({
    where: {
      id: payload.associationId,
    },
    data: {
      renameCompleted: true,
    },
  });
  workerIo.emit(AUTO_RENAME_ASSOCIATION_UPDATE, {
    filePath: association.filePath,
  });
}
