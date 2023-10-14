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
            <VAlert v-if="video.videoLabel && !playlistStore.playlistMappings[video.videoLabel.toLowerCase()]"
                    density="compact"
                    class="mb-2"
                    variant="tonal"
                    color="warning"
            >
              Missing playlist mapping
            </VAlert>
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
      <VRow>
        <VCol>
          <h2 class="mb-2">Help</h2>
          <VExpansionPanels>
            <NameMatchVideoFilesHelp />
            <MissingMatchVideosHelp />
            <MissingPlaylistMapping />
            <UploadErrors />
          </VExpansionPanels>
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import MatchSelector from "@/components/matches/MatchSelector.vue";
import MatchVideosUploader from "@/components/matches/MatchVideosUploader.vue";
import {useMatchStore} from "@/stores/match";
import NameMatchVideoFilesHelp from "@/components/help/NameMatchVideoFilesHelp.vue";
import MissingMatchVideosHelp from "@/components/help/MissingMatchVideosHelp.vue";
import {usePlaylistsStore} from "@/stores/playlists";
import UploadErrors from "@/components/help/UploadErrors.vue";
import MissingPlaylistMapping from "@/components/help/MissingPlaylistMapping.vue";

const error = ref("");

const matchStore = useMatchStore();
const playlistStore = usePlaylistsStore();

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
