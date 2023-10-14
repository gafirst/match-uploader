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
      <MatchDescription />
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
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import MatchSelector from "@/components/matches/MatchSelector.vue";
import MatchVideosUploader from "@/components/matches/MatchVideosUploader.vue";
import {useMatchStore} from "@/stores/match";
import MatchDescription from "@/components/matches/MatchDescription.vue";

const error = ref("");

const matchStore = useMatchStore();
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
