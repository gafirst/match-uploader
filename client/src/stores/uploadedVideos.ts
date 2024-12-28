import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import { isUploadedVideo, UploadedVideo } from "@/types/UploadedVideo";

export const useUploadedVideosStore = defineStore("uploadedVideos", () => {
  const loading = ref(false);
  const error = ref("");
  // FIXME: Need to clear this if event code changes
  // FIXME: Actual typing
  const matchUploadStatuses = ref<any>([]);

  async function getMatchUploadStatuses(): Promise<void> {
    loading.value = true;
    error.value = "";
    const response = await fetch("/api/v1/matches/uploaded");
    if (!response.ok) {
      error.value = "Failed to fetch uploaded videos";
      loading.value = false;
      return;
    }
    const result = await response.json();

    if (!result.ok || !result.matches) {
      error.value = "Failed to fetch uploaded videos";
      loading.value = false;
      return;
    }

    // Validate the returned objects match the UploadedVideo type
    // FIXME: Add type validation
    // result.matches.forEach((video: unknown) => {
    //   if (!isUploadedVideo(video)) {
    //     error.value = "Uploaded video failed type validation";
    //     loading.value = false;
    //   }
    // });

    matchUploadStatuses.value = result.matches;

    loading.value = false;
  }

  return {
    error,
    getMatchUploadStatuses,
    loading,
    matchUploadStatuses,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUploadedVideosStore, import.meta.hot));
}
