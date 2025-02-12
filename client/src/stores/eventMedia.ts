import { acceptHMRUpdate, defineStore } from "pinia";
import { ref, watch } from "vue";
import { VideoInfo } from "@/types/VideoInfo";
import * as path from "node:path";
import { watchDebounced } from "@vueuse/core";

export const useEventMediaStore = defineStore("eventMedia", () => {
  const mediaTitle = ref<string|null>(null);
  const videoCandidates = ref<VideoInfo[]>([]);

  async function getVideoCandidates(videoTitle: string) {
    const response = await fetch(`/api/v1/event-media/videos/recommend?mediaTitle=${encodeURIComponent(videoTitle)}`);
    videoCandidates.value = (await response.json()).videoCandidates.map(
      (video: any): VideoInfo => {
        return {
          path: video.path,
          videoLabel: video.videoLabel,
          videoTitle: video.videoTitle,
          isRequestingJob: false,
          isUploaded: false,
          jobCreationError: null,
          workerJobId: null,
          skipUpload: false,
          videoType: video.videoType,
        };
      });
  }

  const selectedVideoFilePaths = ref<string[]>([]);

  const description = ref<string | null>(null);
  const descriptionLoading = ref(false);
  const descriptionFetchError = ref("");

  async function getSuggestedDescription(): Promise<void> {
    if (!mediaTitle.value) {
      return;
    }

    descriptionLoading.value = true;
    descriptionFetchError.value = "";

    const result = await fetch(`/api/v1/event-media/videos/description?mediaTitle=${encodeURIComponent(mediaTitle.value)}`)
      .catch((error) => {
        description.value = "";
        descriptionFetchError.value = `Unable to retrieve description: ${error}`;
        descriptionLoading.value = false;
        return null;
      });

    if (!result) {
      return;
    }

    if (!result.ok) {
      const message = `Unable to retrieve description`;
      description.value = "";
      descriptionFetchError.value = `API error (${result.status} ${result.statusText}): ${message}`;
      descriptionLoading.value = false;
      return;
    }

    const data = await result.json();

    if (!Object.hasOwnProperty.call(data, "description")) {
      const stringifiedData = JSON.stringify(data);
      description.value = "";
      descriptionFetchError.value =
        `Error: description API response missing description property: ${stringifiedData}`;
      descriptionLoading.value = false;
      return;
    }

    descriptionLoading.value = false;
    description.value = data.description;
  }

  watchDebounced(
    mediaTitle,
    async () => { console.log("Debounce called"); await getSuggestedDescription() },
    { debounce: 250, maxWait: 1000 },
  )

  // FIXME: Disabling FRC events should regenerate video description
  return {
    description,
    descriptionFetchError,
    descriptionLoading,
    getSuggestedDescription,
    getVideoCandidates,
    mediaTitle,
    selectedVideoFilePaths,
    videoCandidates,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventMediaStore, import.meta.hot));
}
