import type { JobHelpers } from "graphile-worker";
import fs from "fs-extra";
import { prisma, workerIo } from "@src/worker";
import { AUTO_RENAME_ASSOCIATION_UPDATE } from "@src/tasks/types/events";

export interface RenameFilePayload {
  directory: string;
  oldFileName: string;
  associationId: string;
}

function assertIsRenameFilePayload(payload: unknown): asserts payload is RenameFilePayload {
  if (payload === null) {
    throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
  } else if (typeof payload === "undefined") {
    throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
  } else if (!(payload as unknown as RenameFilePayload).directory ||
    !(payload as unknown as RenameFilePayload).oldFileName ||
    !(payload as unknown as RenameFilePayload).associationId
  ) {
    throw new Error(`Invalid payload (missing required prop): ${JSON.stringify(payload)}`);
  }
}

export async function renameFile(payload: unknown, {
  logger,
}: JobHelpers): Promise<void> {
  logger.info(JSON.stringify(payload));
  assertIsRenameFilePayload(payload);

  // FIXME: Should fail if the new file name already exists

  const association = await prisma.autoRenameAssociation.findUniqueOrThrow({
    where: {
      filePath: payload.associationId,
    },
  });

  if (!association.newFileName) {
    throw new Error(`Association ${association.filePath} does not have a new file name`);
  }

  logger.info(`Renaming ${payload.directory}/${payload.oldFileName} to ${payload.directory}/${association.newFileName}`);
  // Rename the file
  // FIXME: error handling?
  await fs.rename(`${payload.directory}/${payload.oldFileName}`, `${payload.directory}/${association.newFileName}`);

  await prisma.autoRenameAssociation.update({
    where: {
      filePath: payload.associationId,
    },
    data: {
      renameCompleted: true,
    },
  });
  workerIo.emit(AUTO_RENAME_ASSOCIATION_UPDATE, {
    filePath: association.filePath,
  });
}
