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
                class="mb-4"
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
      <VAlert v-if="!!matchStore.descriptionFetchError"
              color="warning"
              variant="tonal"
              class="mt-2 mb-4"
      >
        An error occurred while fetching the video description for this match. You may want to confirm its accuracy
        before uploading.
      </VAlert>
      <VAlert v-if="matchStore.allMatchVideosUploaded"
              color="success"
              variant="tonal"
              icon="mdi-check-circle"
              class="mt-2 mb-4"
      >
        All videos uploaded!
      </VAlert>
      <VBtn v-if="showQueueAllBtn"
            size="large"
            :color="queueAllBtnColor"
            :prepend-icon="queueAllBtnIcon"
            :disabled="!matchStore.allowMatchUpload"
            @click="matchStore.uploadVideos"
      >
        {{ queueAllBtnText }}
      </VBtn>
      <SandboxModeAlert class="mt-4" :rounded="4" />
      <PrivateUploads class="mt-4" :rounded="4" />
    </VCardText>
  </VCard>
</template>

<script lang="ts" setup>
import {useMatchStore} from "@/stores/match";
import MatchVideoListItem from "@/components/matches/MatchVideoListItem.vue";
import {useSettingsStore} from "@/stores/settings";
import SandboxModeAlert from "@/components/alerts/SandboxModeAlert.vue";
import PrivateUploads from "@/components/alerts/PrivateUploads.vue";
import QueueAllVideosBtn from "@/components/matches/QueueAllVideosBtn.vue";
import { computed } from "vue";

const matchStore = useMatchStore();
const settingsStore = useSettingsStore();

const showQueueAllBtn = computed(() => {
  return !matchStore.allMatchVideosUploaded;
});

const queueAllBtnColor = computed(() => {
  if (settingsStore.settings?.sandboxModeEnabled || settingsStore.settings?.youTubeVideoPrivacy !== "public") {
    return "warning";
  }
  return "success";
});

const queueAllBtnIcon = computed(() => {
  if (matchStore.uploadInProgress) {
    return "mdi-loading mdi-spin";
  }
  return "";
});

const queueAllBtnText = computed(() => {
  if (matchStore.uploadInProgress) {
    return "Uploading...";
  }
  return "Queue all";
});
</script>
