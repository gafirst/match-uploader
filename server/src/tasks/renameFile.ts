import type { JobHelpers } from "graphile-worker";
import fs from "fs-extra";

export interface RenameFilePayload {
  directory: string;
  oldFileName: string;
  newFileName: string;
}

function assertIsRenameFilePayload(payload: unknown): asserts payload is RenameFilePayload {
  if (payload === null) {
    throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
  } else if (typeof payload === "undefined") {
    throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
  } else if (!(payload as unknown as RenameFilePayload).directory ||
    !(payload as unknown as RenameFilePayload).oldFileName ||
    !(payload as unknown as RenameFilePayload).newFileName
  ) {
    throw new Error(`Invalid payload (missing required prop): ${JSON.stringify(payload)}`);
  }
}

export async function renameFile(payload: unknown, {
  logger,
  job,
}: JobHelpers): Promise<void> {
  logger.info(JSON.stringify(payload));
  assertIsRenameFilePayload(payload);

  logger.info(`Renaming ${payload.directory}/${payload.oldFileName} to ${payload.directory}/${payload.newFileName}`);
  // Rename the file
  await fs.rename(`${payload.directory}/${payload.oldFileName}`, `${payload.directory}/${payload.newFileName}`);
}
