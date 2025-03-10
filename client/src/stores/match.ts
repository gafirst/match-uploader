import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { VideoInfo } from "@/types/VideoInfo";
import { useSettingsStore } from "@/stores/settings";
import { useWorkerStore } from "@/stores/worker";
import { WorkerJobStatus } from "@/types/WorkerJob";
import { useMatchListStore } from "@/stores/matchList";
import { PossibleNextMatches } from "@/types/PossibleNextMatches";

export const useMatchStore = defineStore("match", () => {
  // Note: Variables intended to be exported to be used elsewhere must be returned from this function!
  const matches = ref([]);
  const matchListStore = useMatchListStore();
  const settingsStore = useSettingsStore();
  const workerStore = useWorkerStore();
  const selectedMatchKey = ref<string | null>(null);
  const isReplay = ref(false);

  const uploadInProgress = ref(false);

  const nextMatchLoading = ref(false);
  const nextMatchError = ref("");

  async function selectMatch(matchKey: string) {
    nextMatchError.value = "";
    selectedMatchKey.value = matchKey;
    isReplay.value = false;
    await getMatchVideos();
    await getSuggestedDescription();
  }

  /**
   * Utility function to completely clear out the selected match and all related data that is derived from it.
   */
  function clearSelectedMatch() {
    // Clear selected match key
    selectedMatchKey.value = null;

    // Clear data derived from selected match key:
    matchVideos.value = [];
    description.value = null;

    // Clear loading/error states
    nextMatchLoading.value = false;
    nextMatchError.value = "";
    matchVideosLoading.value = false;
    matchVideoError.value = "";
    descriptionLoading.value = false;
    descriptionFetchError.value = "";
  }

  async function getPossibleNextMatches(): Promise<PossibleNextMatches | undefined> {
    if (!selectedMatchKey.value) {
      return;
    }

    const result = await fetch(`/api/v1/matches/${selectedMatchKey.value}/nextMatch`)
      .catch((error) => {
        nextMatchError.value = `Unable to retrieve possible next matches for ${selectedMatchKey.value}: ${error}`;
        return null;
      });

    if (!result) {
      return;
    }

    if (!result.ok) {
      const message = `Unable to retrieve possible next matches for ${selectedMatchKey.value}`;
      nextMatchError.value = `API error (${result.status} ${result.statusText}): ${message}`;
      return;
    }

    const data = await result.json();

    if (data.error) {
      nextMatchError.value = data.error;
      return;
    }

    if (Object.hasOwn(data, "sameLevel") && Object.hasOwn(data, "nextLevel")) {
      return data;
    }

    const message = "API response missing possibleNextMatches property";
    console.error(message);
    nextMatchError.value = message;
  }

  async function advanceMatch() {
    nextMatchError.value = "";

    if (!selectedMatchKey.value) {
      nextMatchError.value = "Cannot advance match because no match is currently selected. If you are seeing this, " +
        "you have found a bug. Congrats! Please open an issue on Github.";
      return;
    }

    nextMatchLoading.value = true;

    const candidates = await getPossibleNextMatches();
    if (!candidates) {
      nextMatchLoading.value = false;
      return;
    }

    let foundNextMatch = false;
    let attempts = 0;
    const maxAttempts = 2;

    while (!foundNextMatch && attempts < maxAttempts) {
      attempts++;

      // If we have already looked once without refreshing, and neither possible next match exists, try refreshing the
      // match list
      if (attempts > 1) {
        await matchListStore.getMatchList(true);
      }

      if (candidates?.sameLevel && matchListStore.matchListContains(candidates.sameLevel)) {
        nextMatchLoading.value = false; // If we find a match, stop showing the spinner since `selectMatch` waits
                                        // until several other long-running loads are complete
        foundNextMatch = true;
        await selectMatch(candidates.sameLevel);
      } else if (candidates?.nextLevel && matchListStore.matchListContains(candidates.nextLevel)) {
        nextMatchLoading.value = false;
        foundNextMatch = true;
        await selectMatch(candidates.nextLevel);
      }
    }

    nextMatchLoading.value = false;
    if (!foundNextMatch) {
      nextMatchError.value = "No match found after this one. If you are expecting another match, try again in a few " +
        "minutes.";
    }
  }

  const matchVideos = ref<VideoInfo[]>([]);
  const matchVideosLoading = ref(false);
  const matchVideoError = ref("");

  async function getMatchVideos() {
    if (!selectedMatchKey.value) {
      return;
    }

    matchVideosLoading.value = true;
    matchVideoError.value = "";

    const result = await fetch(`/api/v1/matches/${selectedMatchKey.value}/videos/recommend?isReplay=${isReplay.value}`)
      .catch((error) => {
        matchVideoError.value = `Unable to retrieve video file suggestions for ${selectedMatchKey.value}: ${error}`;
        matchVideosLoading.value = false;
        return null;
      });

    if (!result) {
      return;
    }

    if (!result.ok) {
      const message = `Unable to retrieve video file suggestions for ${selectedMatchKey.value}`;
      matchVideoError.value = `API error (${result.status} ${result.statusText}): ${message}`;
      matchVideosLoading.value = false;
      return;
    }

    const data = await result.json();

    if (!Object.hasOwnProperty.call(data, "recommendedVideoFiles")) {
      const stringifiedData = JSON.stringify(data);
      matchVideoError.value =
        `Error: video file suggestions API response missing recommendedVideoFiles property: ${stringifiedData}`;
      matchVideosLoading.value = false;
      return;
    }

    matchVideos.value = data.recommendedVideoFiles as VideoInfo[];
    matchVideosLoading.value = false;
  }

  const allMatchVideosQueued = computed(() => {
    return matchVideos.value.length > 0 &&
      matchVideos.value.every(video => video.isUploaded || !!video.workerJobId);
  });

  function videoIsUploaded(video: VideoInfo): boolean {
    return video.isUploaded || workerStore.jobHasStatus(video.workerJobId, [WorkerJobStatus.COMPLETED]);
  }

  const allMatchVideosUploaded = computed(() => {
    return matchVideos.value.length > 0 &&
      matchVideos.value.every(video => videoIsUploaded(video));
  });

  const someMatchVideosUploaded = computed(() => {
    return matchVideos.value.length > 0 &&
      matchVideos.value.some(video => videoIsUploaded(video));
  });

  // TODO: Add types for this function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function uploadVideo(video: VideoInfo): Promise<any> {
    video.isRequestingJob = true;
    video.jobCreationError = null;

    if (!settingsStore.settings?.youTubeVideoPrivacy) {
      throw new Error("Unable to upload video: YouTube video privacy setting is undefined");
    }

    const response = await fetch("/api/v1/youtube/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matchKey: selectedMatchKey.value,
        videoPath: video.path,
        videoTitle: video.videoTitle,
        label: video.videoLabel ?? "Unlabeled",
        description: description.value,
        videoPrivacy: settingsStore.settings.youTubeVideoPrivacy,
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

  async function uploadSingleVideo(video: VideoInfo): Promise<void> {
    uploadInProgress.value = true;
    await uploadVideo(video);
    uploadInProgress.value = false;
  }

  async function uploadVideos(): Promise<void> {
    if (!allowMatchUpload.value) {
      console.error("uploadVideos: allowMatchUpload returned false");
      matchVideoError.value = "Videos can't be queued for upload right now. Check the upload form for errors.";
      return;
    }

    uploadInProgress.value = true;
    for (const video of matchVideos.value) {
      if (!video.isUploaded) {
        await uploadVideo(video);
      }
    }
    uploadInProgress.value = false;
  }

  const description = ref<string | null>(null);
  const descriptionLoading = ref(false);
  const descriptionFetchError = ref("");

  async function getSuggestedDescription() {
    if (!selectedMatchKey.value) {
      return;
    }

    descriptionLoading.value = true;
    descriptionFetchError.value = "";
    description.value = "";
    const result = await fetch(`/api/v1/matches/${selectedMatchKey.value}/description?isReplay=${isReplay.value}`)
      .catch((error) => {
        descriptionFetchError.value = `Unable to retrieve description for ${selectedMatchKey.value}: ${error}`;
        descriptionLoading.value = false;
        return null;
      });

    if (!result) {
      return;
    }

    if (!result.ok) {
      const message = `Unable to retrieve description for ${selectedMatchKey.value}`;
      descriptionFetchError.value = `API error (${result.status} ${result.statusText}): ${message}`;
      descriptionLoading.value = false;
      return;
    }

    const data = await result.json();

    if (!Object.hasOwnProperty.call(data, "description")) {
      const stringifiedData = JSON.stringify(data);
      descriptionFetchError.value =
        `Error: description API response missing description property: ${stringifiedData}`;
      descriptionLoading.value = false;
      return;
    }

    descriptionLoading.value = false;
    description.value = data.description;
  }

  const allowMatchUpload = computed(() => {
    return !uploadInProgress.value
      && matchVideos.value.length
      && !descriptionLoading.value
      && description.value
      && matchVideos.value.every(video => !video.workerJobId)
      && !allMatchVideosUploaded.value;
  });

  function postUploadStepsSucceeded(video: VideoInfo): boolean {
    if (!video.workerJobId) {
      return false;
    }

    const job = workerStore.jobs.get(video.workerJobId);
    if (!job) {
      return false;
    }

    return !!job.linkedOnTheBlueAlliance && !!job.addedToYouTubePlaylist;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  watch(isReplay, async (value, oldValue, onCleanup) => {
    await getMatchVideos();
    await getSuggestedDescription();
  });

  return {
    advanceMatch,
    allMatchVideosQueued,
    allMatchVideosUploaded,
    allowMatchUpload,
    clearSelectedMatch,
    description,
    descriptionFetchError,
    descriptionLoading,
    getMatchVideos,
    getSuggestedDescription,
    isReplay,
    matchVideoError,
    matchVideos,
    matchVideosLoading,
    matches,
    nextMatchError,
    nextMatchLoading,
    postUploadStepsSucceeded,
    selectMatch,
    selectedMatchKey,
    someMatchVideosUploaded,
    uploadInProgress,
    uploadSingleVideo,
    uploadVideos,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMatchStore, import.meta.hot));
}
