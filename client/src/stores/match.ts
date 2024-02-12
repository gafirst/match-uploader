import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { MatchVideoInfo } from "@/types/MatchVideoInfo";
import { useSettingsStore } from "@/stores/settings";
import { useWorkerStore } from "@/stores/worker";
import { WorkerJobStatus } from "@/types/WorkerJob";

export const useMatchStore = defineStore("match", () => {
  // Note: Variables intended to be exported to be used elsewhere must be returned from this function!
  const matches = ref([]);
  const settingsStore = useSettingsStore();
  const workerStore = useWorkerStore();
  const selectedMatchKey = ref<string | null>(null);

  const uploadInProgress = ref(false);

  async function selectMatch(matchKey: string) {
    selectedMatchKey.value = matchKey;
    await getMatchVideos();
    await getSuggestedDescription();
  }

  async function advanceMatch() {
    if (!selectedMatchKey.value) {
      return; // TODO: set to qm1
    }

    const matchKeyRegex = /^(\d{4})([a-z]+)_(q|qf|sf|f)(\d{1,2})?m(\d+)$/;

    const currentMatchNumber = selectedMatchKey.value?.match(matchKeyRegex);

    if (currentMatchNumber && currentMatchNumber.length === 6) {
      console.log(currentMatchNumber[5]);
      const currentMatchNumberDigits = currentMatchNumber[5].length;
      const incrementedMatchNumber = Number.parseInt(currentMatchNumber[5], 10) + 1;
      console.log(incrementedMatchNumber);
      const currentMatchKeyPrefix =
          selectedMatchKey.value.substring(0, selectedMatchKey.value.length - currentMatchNumberDigits);
      const nextMatchKey = `${currentMatchKeyPrefix}${incrementedMatchNumber}`;
      console.log(nextMatchKey);
      await selectMatch(nextMatchKey);
    } else {
      console.error(`Unable to advance match: selected match key ${selectedMatchKey.value} didn't match regex or was `
          + "missing match number in capture groups");
    }
  }

  const matchVideos = ref<MatchVideoInfo[]>([]);
  const matchVideosLoading = ref(false);
  const matchVideoError = ref("");

  async function getMatchVideos() {
    if (!selectedMatchKey.value) {
      return;
    }

    matchVideosLoading.value = true;
    matchVideoError.value = "";

    const result = await fetch(`/api/v1/matches/${selectedMatchKey.value}/videos/recommend`);

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

    matchVideos.value = data.recommendedVideoFiles as MatchVideoInfo[];
    matchVideosLoading.value = false;
  }

  const allMatchVideosQueued = computed(() => {
    return matchVideos.value.length > 0 &&
      matchVideos.value.every(video => video.isUploaded || !!video.workerJobId);
  });

  function videoIsUploaded(video: MatchVideoInfo): boolean {
    return video.isUploaded || workerStore.jobHasStatus(video.workerJobId,[WorkerJobStatus.COMPLETED]);
  }

  const allMatchVideosUploaded = computed(() => {
    return matchVideos.value.length > 0 &&
      matchVideos.value.every(video => videoIsUploaded(video));
  });

  const someMatchVideosUploaded = computed(() => {
    return matchVideos.value.length > 0 &&
      matchVideos.value.some(video => videoIsUploaded(video));
  });

  async function uploadVideo(video: MatchVideoInfo): Promise<any> {
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
    });

    if (!response.ok) {
      video.jobCreationError = `API error (${response.status} ${response.statusText}): Unable to create job`;
      video.isRequestingJob = false;
      return;
    }

    const result: any = await response.json();
    console.log("result", result);

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
        video.jobCreationError = result.errors.map((error: any) => error.msg).join(", ");
      } else {
        video.jobCreationError = result.error;
      }
    }

    video.isRequestingJob = false;
    return result;
  }

  async function uploadSingleVideo(video: MatchVideoInfo): Promise<void> {
    uploadInProgress.value = true;
    await uploadVideo(video);
    uploadInProgress.value = false;
  }

  async function uploadVideos(): Promise<void> {
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

    const result = await fetch(`/api/v1/matches/${selectedMatchKey.value}/description`);

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

  function postUploadStepsSucceeded (video: MatchVideoInfo): boolean {
    if (!video.workerJobId) {
      return false;
    }

    const job = workerStore.jobs.get(video.workerJobId);
    if (!job) {
      return false;
    }

    return !!job.linkedOnTheBlueAlliance && !!job.addedToYouTubePlaylist;
  }

  return {
    advanceMatch,
    allMatchVideosQueued,
    allMatchVideosUploaded,
    allowMatchUpload,
    description,
    descriptionFetchError,
    descriptionLoading,
    getMatchVideos,
    getSuggestedDescription,
    matchVideoError,
    matchVideos,
    matchVideosLoading,
    matches,
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
