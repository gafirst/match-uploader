import type { JobHelpers } from "graphile-worker";
import { type UploadVideoTaskPayload } from "@src/tasks/uploadVideo";
import { assertIsCronPayload, type CronPayload } from "@src/tasks/types/cronPayload";
import { getSettings } from "@src/services/SettingsService";
import { getFilesMatchingPattern } from "@src/repos/FileStorageRepo";

export interface AutoRenameCronPayload {
  _cron: CronPayload;
}

function assertIsUploadVideoTaskPayload(payload: unknown): asserts payload is UploadVideoTaskPayload {
  if (payload === null) {
    throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
  } else if (typeof payload === "undefined") {
    throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
  } else {
    assertIsCronPayload((payload as unknown as AutoRenameCronPayload)._cron);

    // if (!(payload as unknown as AutoRenameCronPayload).title) {
    //     throw new Error(`Invalid payload (missing required prop): ${JSON.stringify(payload)}`);
    // }
  }
}

export async function autoRename(payload: unknown, { logger, job }: JobHelpers): Promise<void> {
  logger.info(JSON.stringify(payload));
  assertIsUploadVideoTaskPayload(payload);

  // 1. Get improperly named match files
  const { videoSearchDirectory } = await getSettings();

  const files = await getFilesMatchingPattern(
    videoSearchDirectory,
    `**/*`,
    2,
    false,
  );

  logger.info(files.join(","));
}
