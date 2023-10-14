<template>
  <VCard class="ml-4 mt-2 mb-2">
    <VCardTitle>Videos to upload</VCardTitle>
    <VCardText>
      <VProgressCircular v-if="matchStore.matchVideosLoading"
                         indeterminate
                         class="mb-2"
      />
      <div v-else-if="matchStore.selectedMatchKey">
        <VList v-if="matchStore.matchVideos.length">
          <MatchVideoListItem v-for="video in matchStore.matchVideos"
                              :key="video.path"
                              :video="video"
          />
        </VList>
        <VAlert v-else
                class="mb-2"
                color="warning"
                variant="tonal"
        >
          No video files found for this match
        </VAlert>
        <VBtn prepend-icon="mdi-refresh"
              variant="outlined"
              class="mb-2"
              :disabled="matchStore.uploadInProgress"
              @click="matchStore.getMatchVideos()"
        >
          Refresh
        </VBtn>
      </div>
      <div v-else>
        <p class="mb-2">No match selected</p>
      </div>
      <VBtn :color="settingsStore.settings?.sandboxModeEnabled ? 'warning' : 'success'"
            size="large"
            :prepend-icon="matchStore.uploadInProgress ? 'mdi-loading mdi-spin' : ''"
            :disabled="matchStore.uploadInProgress || !matchStore.matchVideos.length || !matchStore.description"
            @click="uploadVideos"
      >
        {{ matchStore.uploadInProgress ? "Uploading..." : "Upload all" }}
      </VBtn>
      <SandboxModeAlert class="mt-4" :rounded="4" />
    </VCardText>
  </VCard>
</template>

<script lang="ts" setup>
import {useMatchStore} from "@/stores/match";
import {MatchVideoInfo} from "@/types/MatchVideoInfo";
import MatchVideoListItem from "@/components/matches/MatchVideoListItem.vue";
import {useSettingsStore} from "@/stores/settings";
import SandboxModeAlert from "@/components/alerts/SandboxModeAlert.vue";

const matchStore = useMatchStore();
const settingsStore = useSettingsStore();

// TODO: cleanup types
async function uploadVideo(video: MatchVideoInfo): Promise<any> {
  video.uploadInProgress = true;
  const result = await fetch("/api/v1/youtube/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      videoPath: video.path,
      videoTitle: video.videoTitle,
      label: video.videoLabel ?? "Unlabeled",
      description: matchStore.description,
      videoPrivacy: "private",
    }),
  });
  video.uploadInProgress = false;
  return result.json();
}

async function uploadVideos() {
  matchStore.uploadInProgress = true;
  for (const video of matchStore.matchVideos) {
    const result = await uploadVideo(video);
    console.log("result", result);
    if (result.ok) {
      video.uploaded = true;
      video.youTubeVideoId = result.videoId;
      video.youTubeVideoUrl = `https://www.youtube.com/watch?v=${result.videoId}`;
    } else {
      // Catches if the server returns parameter validation errors
      if (result.errors) {
        console.log("errors", result.errors);
        video.uploadError = result.errors.map((error: any) => error.msg).join(", ");
      } else {
        video.uploadError = result.error;
      }
    }
  }
  matchStore.uploadInProgress = false;
}
</script>
