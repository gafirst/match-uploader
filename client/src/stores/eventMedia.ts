import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import { VideoInfo } from "@/types/VideoInfo";
import * as path from "node:path";

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

  // FIXME: Disabling FRC events should regenerate video description
  return {
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
