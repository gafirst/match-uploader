import { acceptHMRUpdate, defineStore } from "pinia";
import { ref, watch } from "vue";
import { VideoInfo } from "@/types/VideoInfo";
import * as path from "node:path";
import { watchDebounced } from "@vueuse/core";
import { uploadVideo } from "@/util/videos";
import { useSettingsStore } from "@/stores/settings";
import { YouTubeVideoPrivacy } from "@/types/youtube/YouTubeVideoPrivacy";

export const useEventMediaStore = defineStore("eventMedia", () => {
  const settingsStore = useSettingsStore();

  const mediaTitle = ref<string|null>(null);

  const videoFilePaths = ref<string[]>([]);
  const videoFilesLoading = ref(false);

  const videoCandidates = ref<VideoInfo[]>([]);
  const error = ref<string>("");

  const videoToUploadLoading = ref(false);

  async function getVideoFiles() {
    error.value = "";
    videoFilesLoading.value = true;

    const result = await fetch(`/api/v1/event-media/videos/recommend`)
      .catch((e) => {
        error.value = `Unable to retrieve video files: ${e}`;
        videoFilesLoading.value = false;
        return null;
      });

    if (!result) {
      return;
    }

    if (!result.ok) {
      const message = `Unable to retrieve video files`;
      error.value = `API error (${result.status} ${result.statusText}): ${message}`;
      videoFilesLoading.value = false;
      return;
    }

    const data = await result.json();

    if (!Object.hasOwnProperty.call(data, "videoFiles")) {
      const stringifiedData = JSON.stringify(data);
      error.value =
        `Error: video files API response missing videoFiles property: ${stringifiedData}`;
      videoFilesLoading.value = false;
      return;
    }

    videoFilePaths.value = data.videoFiles;

    videoFilesLoading.value = false;

    if (!videoFilePaths.value.length) {
      error.value = "There are no event media files to upload right now. File names including the word \"qualification\" or \"playoff\" (case-insensitive) are not shown here.";
    }
  }

  const selectedVideoFilePath = ref<string|null>(null);

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
      .catch((e) => {
        description.value = "";
        descriptionFetchError.value = `Unable to retrieve description: ${e}`;
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

  async function getVideoMetadata(): Promise<void> {
    if (!mediaTitle.value || !selectedVideoFilePath.value) {
      return;
    }

    videoToUploadLoading.value = true;
    const response = await fetch(`/api/v1/event-media/videos/metadata`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaTitle: mediaTitle.value,
          paths: [selectedVideoFilePath.value],
        }),
      }
    ).catch((e) => {
      error.value = `Unable to retrieve video metadata: ${e}`;
      console.log(e);
      videoToUploadLoading.value = false;
      return null;
    });

    if (!response) {
      return;
    }

    if (!response.ok) {
      const message = `Unable to retrieve video metadata`;
      videoToUploadLoading.value = false;
      error.value = `API error (${response.status} ${response.statusText}): ${message}`;
      return;
    }

    const data = await response.json();

    if (!Object.hasOwnProperty.call(data, "videoCandidates")) {
      const stringifiedData = JSON.stringify(data);
      videoToUploadLoading.value = false;
      error.value =
        `Error: video metadata API response missing videoCandidates property: ${stringifiedData}`;
      return;
    }

    videoToUploadLoading.value = false;
    videoCandidates.value = data.videoCandidates;
    videoCandidates.value.forEach(video => {
      if (video.path === selectedVideoFilePath.value) {
        selectedVideoFile.value = video;
      }
    });
  }

  watchDebounced(
    mediaTitle,
    async () => {
      await getSuggestedDescription();
      await getVideoMetadata();
    },
    { debounce: 250, maxWait: 1000 },
  )

  const selectedVideoFile = ref<VideoInfo | null>(null);

  watch(selectedVideoFilePath, async () => {
    await getVideoMetadata();
  });

  async function triggerUpload() {
    if (!selectedVideoFile.value) {
      return;
    }

    if (!description.value) {
      return;
    }

    if (!settingsStore.settings) {
      return;
    }

    selectedVideoFile.value.isRequestingJob = true;
    await uploadVideo(selectedVideoFile.value, description.value, settingsStore.settings.youTubeVideoPrivacy as YouTubeVideoPrivacy);
    selectedVideoFile.value.isRequestingJob = false;
  }

  // FIXME: Disabling FRC events should regenerate video description
  return {
    description,
    descriptionFetchError,
    descriptionLoading,
    error,
    getSuggestedDescription,
    getVideoFiles,
    getVideoMetadata,
    mediaTitle,
    selectedVideoFilePath,
    selectedVideoFile,
    triggerUpload,
    videoCandidates,
    videoFilesLoading,
    videoFilePaths,
    videoToUploadLoading,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEventMediaStore, import.meta.hot));
}
