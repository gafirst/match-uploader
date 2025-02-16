import { VideoInfo } from "@/types/VideoInfo";
import { YouTubeVideoPrivacy } from "@/types/youtube/YouTubeVideoPrivacy";

export async function uploadVideo(video: VideoInfo,
  description: string,
  videoPrivacy: YouTubeVideoPrivacy,
  matchKey: string | null = null): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  video.isRequestingJob = true;
  video.jobCreationError = null;

  const response = await fetch("/api/v1/youtube/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      matchKey,
      videoPath: video.path,
      videoTitle: video.videoTitle,
      label: video.videoLabel ?? "Unlabeled",
      description,
      videoPrivacy,
      videoType: video.videoType,
    }),
  }).catch((error) => {
    video.jobCreationError = `Unable to create job: ${error}`;
    video.isRequestingJob = false;
    return null;
  });

  if (!response) {
    return;
  }

  if (!response.ok) {
    video.jobCreationError = `API error (${response.status} ${response.statusText}): Unable to create job`;
    video.isRequestingJob = false;
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await response.json();

  if (response.ok) {
    if (result.workerJob && result.workerJob.jobId) {
      video.workerJobId = result.workerJob.jobId;
    } else {
      video.jobCreationError = "Worker job ID not found in response";
    }
  } else {
    // Catches if the server returns parameter validation errors
    if (result.errors) {
      console.log("errors", result.errors);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      video.jobCreationError = result.errors.map((error: any) => error.msg).join(", ");
    } else {
      video.jobCreationError = result.error;
    }
  }

  video.isRequestingJob = false;
  return result;
}
