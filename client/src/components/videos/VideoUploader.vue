<template>
  <VCard class="ml-4 mt-2 mb-2">
    <VCardTitle>Videos to upload</VCardTitle>
    <VCardText>
      <LoadingSpinner
        v-if="loading"
        class="mt-2 mb-4"
      />
      <div v-else-if="matchStore.selectedMatchKey">
        <VChip
          v-if="matchStore.isReplay"
          class="mb-2"
          color="info"
        >
          Replay
        </VChip>
        <VAlert
          v-if="matchStore.matchVideoError"
          class="mb-2"
          color="error"
          variant="tonal"
          :text="matchStore.matchVideoError"
        />
        <VList v-if="matchStore.matchVideos.length">
          <MatchVideoListItem
            v-for="video in matchStore.matchVideos"
            :key="video.path"
            :video="video"
          />
        </VList>
        <VAlert
          v-else
          class="mt-2 mb-2"
          color="warning"
          variant="tonal"
        >
          No video files found
        </VAlert>
        <VBtn
          prepend-icon="mdi-refresh"
          variant="outlined"
          class="mb-2"
          :disabled="matchStore.uploadInProgress"
          @click="matchStore.getMatchVideos()"
        >
          Refresh
        </VBtn>
      </div>
      <div v-else>
        <p class="mb-2">
          No match selected
        </p>
      </div>
      <VAlert
        v-if="matchStore.selectedMatchKey && !descriptionSet && !descriptionLoading
          && !matchStore.allMatchVideosQueued && allVideosUploaded"
        color="error"
        variant="tonal"
        class="mt-2 mb-2"
      >
        To upload videos for this match, regenerate or manually enter a description
      </VAlert>
      <VAlert
        v-if="!!matchStore.descriptionFetchError"
        color="warning"
        variant="tonal"
        class="mt-2 mb-2"
      >
        An error occurred while fetching the video description. You may want to confirm its accuracy before uploading.
      </VAlert>
      <VAlert
        v-if="matchStore.allMatchVideosUploaded"
        color="success"
        variant="tonal"
        icon="mdi-check-circle"
      >
        All videos uploaded!
      </VAlert>
      <VBtn
        v-if="showQueueAllBtn"
        size="large"
        :color="queueAllBtnColor"
        :prepend-icon="queueAllBtnIcon"
        :disabled="!matchStore.allowMatchUpload"
        @click="matchStore.uploadVideos"
      >
        {{ queueAllBtnText }}
      </VBtn>
      <SandboxModeAlert
        class="mt-2"
        :rounded="4"
      />
      <PrivateUploads
        class="mt-2"
        :rounded="4"
      />
    </VCardText>
  </VCard>
</template>

<script lang="ts" setup>
import {useMatchStore} from "@/stores/match";
import MatchVideoListItem from "@/components/matches/MatchVideoListItem.vue";
import {useSettingsStore} from "@/stores/settings";
import SandboxModeAlert from "@/components/alerts/SandboxModeAlert.vue";
import PrivateUploads from "@/components/alerts/PrivateUploads.vue";
import { computed } from "vue";
import LoadingSpinner from "@/components/util/LoadingSpinner.vue";
import { YouTubeVideoPrivacy } from "@/types/youtube/YouTubeVideoPrivacy";
import { VideoInfo } from "@/types/VideoInfo";

const props = defineProps<{
  loading?: boolean;
  sandboxModeEnabled?: boolean;
  youTubeVideoPrivacy?: YouTubeVideoPrivacy;
  videos: VideoInfo[];
  descriptionSet?: boolean;
  descriptionFetchError?: boolean;
  descriptionLoading?: boolean;
}>();

const allVideosQueued = computed(() => {
  // FIXME: Implement this
  return props.videos.every(video => video);
});

const allVideosUploaded = computed(() => {
  // FIXME: Move to some kind of common lib?
  return props.videos.every(video => video.isUploaded);
});

const showQueueAllBtn = computed(() => {
  return !props.loading && allVideosUploaded.value;
});

const queueAllBtnColor = computed(() => {
  if (props.sandboxModeEnabled || props.youTubeVideoPrivacy !== "public") {
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
  if (matchStore.someMatchVideosUploaded) {
    return "Queue all remaining";
  }
  return "Queue all";
});
</script>
