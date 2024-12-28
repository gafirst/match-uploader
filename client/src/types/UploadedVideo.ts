export interface UploadedVideo {
  filePath: string;
  eventKey: string;
  matchKey: string;
  label: string;
  isReplay: boolean;
  createdAt: string;
  updatedAt: string;
  addToYouTubePlaylistSucceeded: boolean | null;
  linkOnTheBlueAllianceSucceeded: boolean | null;
  youTubeVideoId: string;
  workerJobId: number | null;
}

export function isUploadedVideo(x: unknown): x is UploadedVideo {
  return x !== null &&
    typeof x === "object" &&
    "filePath" in x &&
    "eventKey" in x &&
    "matchKey" in x &&
    "label" in x &&
    "isReplay" in x &&
    "createdAt" in x &&
    "updatedAt" in x &&
    "addToYouTubePlaylistSucceeded" in x &&
    "linkOnTheBlueAllianceSucceeded" in x &&
    "youTubeVideoId" in x &&
    "workerJobId" in x;
}
