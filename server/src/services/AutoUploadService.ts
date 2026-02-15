import { queueJob } from "@src/util/queueJob";
import { graphileWorkerUtils, prisma } from "@src/server";
import { io } from "@src/index";

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