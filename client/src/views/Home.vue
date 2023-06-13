<template>
  <VRow>
    <VCol md="6">
      <h1 class="mb-2">Upload match</h1>

      <VAlert v-if="!!error"
              color="error"
      >
        {{ error }}
      </VAlert>

      <h2 class="mb-2">Match info</h2>
      <MatchSelector
        @match-selected="matchSelected"
      />

      <h3 class="mb-2">Video files</h3>
      <div v-if="selectedMatchKey">
        <VList v-if="videoFileSuggestions.length">
          <VListItem v-for="file in videoFileSuggestions"
                     :key="file.path"
                     :title="file.path"
                     :subtitle="file.videoLabel ? `Label: ${file.videoLabel}`: ''"
          />
        </VList>
        <VAlert v-else
                class="mb-2"
                color="warning"
        >
          No video files found.
        </VAlert>
      </div>
      <p v-else class="mb-2">No match selected</p>
      <VExpansionPanels>
        <VExpansionPanel>
          <VExpansionPanelTitle>
            How to name match video files
          </VExpansionPanelTitle>
          <VExpansionPanelText>
            <strong>Qualification matches:</strong> <pre>Qualification #[ Label].mp4</pre>
            <br />
            <strong>Double elimination playoff matches:</strong> <pre>Playoff #[ Label].mp4</pre>
            <br />
            <strong>Best of 3 playoff matches:</strong> <pre>Quarterfinal #[ Label].mp4</pre> or
            <pre>Semifinal #[ Label].mp4</pre> or <pre>Final #[ Label].mp4</pre>

            <br />
            Be sure to set your playoff type in Settings so we know how to parse your playoff matches!
          </VExpansionPanelText>
        </VExpansionPanel>
      </VExpansionPanels>

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
    <VCol md="6">
      <h1 class="mb-2">Preview</h1>
      <h2 class="mb-2">Video 1: Overhead</h2>
      <VSkeletonLoader boilerplate
                       color="gray"
                       class="mb-2"
      />
      <h3 class="mb-2">{{ selectedMatchKey ?? "Video title" }}</h3>
      <pre class="mb-2 description">{{ matchDescription ?? "Video description" }}</pre>
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from "vue";
import MatchSelector from "@/components/form/MatchSelector.vue";
import { VSkeletonLoader } from "vuetify/labs/VSkeletonLoader";
import {MatchVideoFileInfo} from "@/types/MatchVideoFileInfo";
import YouTubeChannelSelector from "@/components/form/YouTubeChannelSelector.vue";
import MatchVideosUploader from "@/components/matches/MatchVideosUploader.vue";
import {MatchVideoUploadInfo} from "@/types/MatchVideoUploadInfo";
import {YouTubeVideoPrivacy} from "@/types/youtube/YouTubeVideoPrivacy";

const selectedMatchKey = ref<string|null>(null);
const matchDescription = ref<string|null>(null);
const videoSuggestionsLoading = ref(false);
const error = ref("");

function matchSelected(matchKey: string) {
  selectedMatchKey.value = matchKey;
}

const videoFileSuggestions = ref<MatchVideoFileInfo[]>([]);


function handleApiError(result: Response, message: string) {
  if (!result.ok) {
    error.value = `API error (${result.status} ${result.statusText}): ${message}`;
    return true;
  }

  return false;
}

async function getSuggestions() {
  videoSuggestionsLoading.value = true;

  const suggestionsResult = await fetch(`/api/v1/matches/${selectedMatchKey.value}/videos/recommend`);

  if (handleApiError(suggestionsResult, `Unable to retrieve video file suggestions for ${selectedMatchKey.value}`)) {
    videoSuggestionsLoading.value = false;
    return;
  }

  const data = await suggestionsResult.json();

  if (! Object.hasOwnProperty.call(data, "recommendedVideoFiles")) {
    error.value =
      `Error: video file suggestions API response missing recommendedVideoFiles property: ${JSON.stringify(data)}`;
    videoSuggestionsLoading.value = false;
    return;
  }

  videoFileSuggestions.value = data.recommendedVideoFiles as MatchVideoFileInfo[];
  videoSuggestionsLoading.value = false;
}

watch(selectedMatchKey, async (newValue, oldValue) => {
  if (newValue) {
    await getSuggestions();
  }
}, { immediate: true });

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
</style>
