<template>
  <VRow>
    <VCol cols="12" md="5">
      <h1 class="mb-2">Upload match</h1>

      <VAlert v-if="!!error"
              color="error"
      >
        {{ error }}
      </VAlert>

      <h2 class="mb-2">Match info</h2>
      <MatchSelector />

      <h2
        class="mt-2 mb-2"
      >
        Video metadata
      </h2>
      <VTextarea v-model="matchStore.description"
                 label="Description"
                 :disabled="matchStore.uploadInProgress"
                 messages="Raw YouTube video description"
                 class="mb-4"
      />

      <!--      <h3>YouTube</h3>-->
      <!--      <YouTubeChannelSelector class="mt-2 mb-4" />-->
    </VCol>
    <VCol cols="12" md="7">
      <h2 class="mb-2">Videos</h2>
      <VRow>
        <VSheet class="d-flex flex-wrap">
          <VSheet v-for="video in matchStore.matchVideos"
                  :key="video.path"
                  class="pa-3 video-preview"
          >
            <h3>{{ video.videoLabel ?? "Unlabeled" }}</h3>
            <video :src="`videos/${video.path}`"
                   controls
                   preload="metadata"
            />
          </VSheet>
        </VSheet>
      </VRow>
      <VRow>
        <MatchVideosUploader />
      </VRow>

      <!--      <h2>YouTube channel</h2>-->
      <!--      <VRow align="center">-->
      <!--        <VCol>-->
      <!--          <VAvatar v-if="selectedYouTubeChannel && selectedYouTubeChannel.thumbnailUrl"-->
      <!--                   :image="selectedYouTubeChannel.thumbnailUrl"-->
      <!--          />-->

      <!--          {{ selectedYouTubeChannel?.title ?? "No channel selected" }}-->
      <!--        </VCol>-->
      <!--      </VRow>-->
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import MatchSelector from "@/components/matches/MatchSelector.vue";
import MatchVideosUploader from "@/components/matches/MatchVideosUploader.vue";
import {useMatchStore} from "@/stores/match";

const error = ref("");

const matchStore = useMatchStore();

// const { data: youTubeStatus, error: youTubeStatusError } = useSWRV("/api/v1/youtube/status");

// watch(youTubeStatusError, (err) => {
//   console.error("YouTube status error:", err.message);
//   error.value = `Error obtaining authenticated YouTube channel info: ${err.message}`;
// });
//
// function isYouTubeStatus(obj: object): obj is IYouTubeStatus {
//   return !!(obj as IYouTubeStatus).channels;
// }

// const selectedYouTubeChannel = computed(() => {
//   if (!youTubeStatus.value) {
//     console.log("no status");
//     return null;
//   }
//
//   if (!isYouTubeStatus(youTubeStatus.value)) {
//     return null;
//   }
//
//   return youTubeStatus.value.channels.find((channel) => channel.id === matchStore.youTubeChannelId);
// });

</script>

<style>
.video-preview {
  max-width: 12.25rem;
}

/* https://css-tricks.com/fluid-width-video/ */
video {
  /* override other styles to make responsive */
  width: 100% !important;
  height: auto !important;
}
</style>
