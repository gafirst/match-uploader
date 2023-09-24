<template>
  <VRow>
    <VCol cols="12" md="6">
      <h1 class="mb-2">Upload match</h1>

      <VAlert v-if="!!error"
              color="error"
      >
        {{ error }}
      </VAlert>

      <h2 class="mb-2">Match info</h2>
      <MatchSelector />

      <h3>
        Video files
      </h3>
      <MatchVideoFiles />

      <h2
        class="mt-2 mb-2"
      >
        Video metadata
      </h2>
      <VTextarea v-model="matchDescription"
                 label="Description"
                 messages="Raw YouTube video description"
                 class="mb-4"
      />

      <YouTubeChannelSelector />
      <MatchVideosUploader :videos="videoDataForUploads" />
    </VCol>
    <VCol v-if="matchStore.videoFileSuggestions.length"
          cols="12"
          md="6"
    >
      <h1 class="mb-2">Preview</h1>

      <VRow>
        <VSheet class="d-flex flex-wrap">
          <VSheet v-for="video in matchStore.videoFileSuggestions"
                  :key="video.path"
                  class="pa-3 video-preview"
          >
            <h2>{{ video.videoLabel ?? "Unlabeled" }}</h2>
            <video :src="`videos/${video.path}`"
                   controls
                   preload="metadata"
            />
          </VSheet>
        </VSheet>
      </VRow>

      <h2>YouTube channel</h2>
      <VRow align="center">
        <VCol>
          <VAvatar v-if="selectedYouTubeChannel && selectedYouTubeChannel.thumbnailUrl"
                   :image="selectedYouTubeChannel.thumbnailUrl"
          />

          {{ selectedYouTubeChannel?.title ?? "No channel selected" }}
        </VCol>
      </VRow>

      <h2>Description</h2>
      <pre class="mb-2 description">{{ matchDescription ?? "Video description" }}</pre>

      <!--      <VSkeletonLoader boilerplate-->
      <!--                       color="gray"-->
      <!--                       class="mb-2"-->
      <!--      />-->
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from "vue";
import MatchSelector from "@/components/matches/MatchSelector.vue";
import {MatchVideoFileInfo} from "@/types/MatchVideoFileInfo";
import YouTubeChannelSelector from "@/components/form/YouTubeChannelSelector.vue";
import MatchVideosUploader from "@/components/matches/MatchVideosUploader.vue";
import {MatchVideoUploadInfo} from "@/types/MatchVideoUploadInfo";
import {YouTubeVideoPrivacy} from "@/types/youtube/YouTubeVideoPrivacy";
import {useMatchStore} from "@/stores/match";
import MatchVideoFiles from "@/components/matches/MatchVideoFiles.vue";
import useSWRV from "swrv";
import {IYouTubeStatus} from "@/types/youtube/IYouTubeStatus";

const matchDescription = ref<string|null>(null);
const error = ref("");

const videoFileSuggestions = ref<MatchVideoFileInfo[]>([]);

const matchStore = useMatchStore();

const { data: youTubeStatus, error: youTubeStatusError } = useSWRV("/api/v1/youtube/status");

watch(youTubeStatusError, (err) => {
  console.error("YouTube status error:", err.message);
  error.value = `Error obtaining authenticated YouTube channel info: ${err.message}`;
});

function isYouTubeStatus(obj: object): obj is IYouTubeStatus {
  return !!(obj as IYouTubeStatus).channels;
}

const selectedYouTubeChannel = computed(() => {
  if (!youTubeStatus.value) {
    console.log("no status");
    return null;
  }

  if (!isYouTubeStatus(youTubeStatus.value)) {
    return null;
  }

  return youTubeStatus.value.channels.find((channel) => channel.id === matchStore.youTubeChannelId);
});

const videoDataForUploads = computed((): MatchVideoUploadInfo[] => {
  return videoFileSuggestions.value.map((file) => {
    return {
      path: file.path,
      videoTitle: file.videoLabel,
      description: matchDescription.value,
      videoPrivacy: "private" as YouTubeVideoPrivacy,
    };
  });
});
</script>

<style>
pre.description {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
}

.video-preview {
  max-width: 15rem;
}

/* https://css-tricks.com/fluid-width-video/ */
video {
  /* override other styles to make responsive */
  width: 100% !important;
  height: auto !important;
}
</style>
