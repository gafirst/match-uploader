import type MatchKey from "@src/models/MatchKey";
import { Match } from "@src/models/Match";
import type { AddJobFunction } from "graphile-worker";
import type { AutoRenameAssociation, PrismaClient, WorkerJob } from "@prisma/client";
import { type DateTime } from "luxon";
import { queueJob } from "@src/util/queueJob";
import { RENAME_FILE } from "@src/tasks/types/tasks";
import { type Server as SocketIOServer } from "socket.io";
import { type Socket } from "socket.io-client";

export function getNewFileNamePreservingExtension(
  fileNameWithExtension: string,
  newFileNameWithoutExtension: string,
): string {
  const oldExtension = fileNameWithExtension.split(".").pop();
  return `${newFileNameWithoutExtension}.${oldExtension}`;
}

export function getNewFileNameForAutoRename(matchKey: MatchKey, isReplay: boolean): string {
    const match = new Match(matchKey, isReplay);
    return match.videoFileMatchingName;
}

export async function queueRenameJob(
  prisma: PrismaClient,
  addJob: AddJobFunction,
  io: SocketIOServer | Socket,
  association: AutoRenameAssociation,
  videoSearchDirectory: string,
  renameAfter: DateTime,
  priority: number | undefined = undefined,
): Promise<WorkerJob> {
  return await queueJob(
    prisma,
    addJob,
    io,
    association.videoFile,
    RENAME_FILE,
    {
      directory: `${videoSearchDirectory}/${association.videoLabel}`,
      oldFileName: association.videoFile,
      associationId: association.filePath,
    },
    {
      maxAttempts: 1,
      jobKey: `autoRename-${association.filePath}`,
      jobKeyMode: "replace",
      runAt: renameAfter.toJSDate(),
      priority,
    },
  );
}
