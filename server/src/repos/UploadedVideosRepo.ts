import { JobStatus, type Prisma, type PrismaClient, type UploadedVideo } from "@prisma/client";
import { type WorkerPrismaClient } from "@src/worker";
import MatchKey from "@src/models/MatchKey";
import { PlayoffsType } from "@src/models/PlayoffsType";
import { Match } from "@src/models/Match";

export async function getUploadedVideos(
  prisma: PrismaClient | WorkerPrismaClient,
): Promise<UploadedVideo[]> {
  return await prisma.uploadedVideo.findMany();
}

type MatchUploadStatus = "COMPLETED" | "PARTIAL" | "NOT_STARTED";

type UploadedVideoWithWorkerJob = Prisma.UploadedVideoGetPayload<{
  include: { workerJob: true }
}>

interface UploadStatusSummary {
  matchKey: string;
  matchName: string;
  status: MatchUploadStatus;
  statusByLabel: {
    [label: string]: {
      success: boolean;
      count: number;
      postUploadStepsSucceeded: boolean;
    };
  };
}


// FIXME: extract types from this file
export interface EventUploadStatusByMatch {
  eventKey: string,
  matches: UploadStatusSummary[],
}

function summarizeUploadsForMatch(
  matchKey: string,
  uploadedVideos: UploadedVideoWithWorkerJob[],
  expectedLabels: Set<string>,
  playoffsType: PlayoffsType,
): UploadStatusSummary {
  const summary: UploadStatusSummary = {
    matchKey,
    matchName: new Match(MatchKey.fromString(matchKey, playoffsType), false).matchName,
    status: "NOT_STARTED",
    statusByLabel: {},
  };

  for (const video of uploadedVideos) {
    const videoLabel = video.label.toLowerCase();
    if (!Object.hasOwnProperty.call(summary.statusByLabel, videoLabel)) {
      summary.statusByLabel[videoLabel] = {
        success: true,
        count: 0,
        postUploadStepsSucceeded: true,
      };
    }

    summary.statusByLabel[videoLabel].count++;

    if (video.workerJob?.status !== JobStatus.COMPLETED) {
      summary.statusByLabel[videoLabel].success = false;
    }

    if (!video.workerJob?.addedToYouTubePlaylist || !video.workerJob?.linkedOnTheBlueAlliance) {
      summary.statusByLabel[videoLabel].postUploadStepsSucceeded = false;
    }
  }

  const actualLabels = new Set(Object.keys(summary.statusByLabel).map(label => label.toLowerCase()));
  const missingLabels = expectedLabels.difference(actualLabels);

  if (missingLabels.size === 0) {
    summary.status = "COMPLETED";
  } else if (missingLabels.size < expectedLabels.size) {
    summary.status = "PARTIAL";
  }

  missingLabels.forEach(label => {
    summary.statusByLabel[label] = {
      success: false,
      count: 0,
      postUploadStepsSucceeded: false,
    };
  });

  return summary;
}

export async function getUploadedVideosByPlaylist(
  prisma: PrismaClient | WorkerPrismaClient,
  eventKey: string,
  expectedLabels: Set<string>,
  playoffsType: PlayoffsType,
): Promise<EventUploadStatusByMatch> {
  const videos: UploadedVideoWithWorkerJob[] = await prisma.uploadedVideo.findMany({
    where: {
      eventKey,
    },
    include: {
      workerJob: true,
    },
  });

  const result: EventUploadStatusByMatch = {
    eventKey,
    matches: [],
  };

  const videosByMatchKey: {
    [matchKey: string]: UploadedVideoWithWorkerJob[],
  } = {};

  videos.forEach((video) => {
    if (Object.hasOwnProperty.call(videosByMatchKey, video.matchKey)) {
      videosByMatchKey[video.matchKey].push(video);
    } else {
      videosByMatchKey[video.matchKey] = [video];
    }
  });

  for (const matchKey of Object.keys(videosByMatchKey)) {
    const videosForMatch = videosByMatchKey[matchKey];
    result.matches.push(summarizeUploadsForMatch(matchKey, videosForMatch, expectedLabels, playoffsType));
  }

  return result;
}
