import { JobStatus, type Prisma, type PrismaClient } from "@prisma/client";
import { type WorkerPrismaClient } from "@src/worker";
import MatchKey from "@src/models/MatchKey";
import { PlayoffsType } from "@src/models/PlayoffsType";
import { Match } from "@src/models/Match";
import { TbaMatchSimple } from "@src/models/theBlueAlliance/tbaMatchesSimpleApiResponse";
import { EventUploadStatusByMatch, MatchUploadStatus, UploadStatusSummary } from "@src/models/UploadedVideo";

type UploadedVideoWithWorkerJob = Prisma.UploadedVideoGetPayload<{
  include: { workerJob: true }
}>

function summarizeUploadsForMatch(
  matchKey: string,
  uploadedVideos: UploadedVideoWithWorkerJob[],
  expectedLabels: Set<string>,
  playoffsType: PlayoffsType,
): UploadStatusSummary {
  const summary: UploadStatusSummary = {
    matchKey,
    matchName: new Match(MatchKey.fromString(matchKey, playoffsType), false).matchName,
    status: MatchUploadStatus.NOT_STARTED,
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

  const actualLabels = new Set(
    Object.keys(summary.statusByLabel)
      .filter(label => summary.statusByLabel[label].success)
      .map(label => label.toLowerCase())
  );
  const missingLabels = expectedLabels.difference(actualLabels);

  if (missingLabels.size === 0) {
    summary.status = MatchUploadStatus.COMPLETED;
  } else if (missingLabels.size < expectedLabels.size) {
    summary.status = MatchUploadStatus.PARTIAL;
  }

  missingLabels.forEach(label => {
    if (!Object.hasOwnProperty.call(summary.statusByLabel, label)) {
      summary.statusByLabel[label] = {
        success: false,
        count: 0,
        postUploadStepsSucceeded: false,
      };
    }
  });

  return summary;
}

export async function getEventUploadStatusByMatch(
  prisma: PrismaClient | WorkerPrismaClient,
  eventKey: string,
  expectedLabels: Set<string>,
  playoffsType: PlayoffsType,
  allMatches: TbaMatchSimple[],
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
    totals: {
      total: 0,
      completed: 0,
      partial: 0,
      notStarted: 0,
    },
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

  allMatches.forEach(match => {
    if (!Object.hasOwnProperty.call(videosByMatchKey, match.key)) {
      videosByMatchKey[match.key] = [];
    }
  });

  for (const matchKey of Object.keys(videosByMatchKey)) {
    const videosForMatch = videosByMatchKey[matchKey];
    result.matches.push(summarizeUploadsForMatch(matchKey, videosForMatch, expectedLabels, playoffsType));
  }

  result.matches.sort((a, b): number => {
    const matchKeyA = MatchKey.fromString(a.matchKey, playoffsType);
    const matchKeyB = MatchKey.fromString(b.matchKey, playoffsType);
    return matchKeyA.compare(matchKeyB);
  });

  result.totals = result.matches.reduce((previousValue, currentValue, currentIndex, array) => {
    if (currentValue.status === MatchUploadStatus.COMPLETED) {
      previousValue.completed++;
    } else if (currentValue.status === MatchUploadStatus.PARTIAL) {
      previousValue.partial++;
    } else {
      previousValue.notStarted++;
    }

    previousValue.total++;

    if (currentIndex === array.length - 1) {
      return previousValue;
    }

    return previousValue;
  }, {
    total: 0,
    completed: 0,
    partial: 0,
    notStarted: 0,
  });

  return result;
}
