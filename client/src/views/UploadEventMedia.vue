<template>
  <VRow>
    <VCol
      cols="12"
      md="5"
    >
      <h1 class="mb-2">Upload event media</h1>
      <VAlert
        v-if="!!error"
        color="error"
      >
        {{ error }}
      </VAlert>

      <VAlert
        v-if='eventMediaStore.mediaTitle?.includes("#")'
        variant="tonal"
        color="warning"
        class="mb-4"
        icon="mdi-pound"
      >
        Psst! Make sure to replace all # signs in the media title with the actual number.
      </VAlert>
<!--      TODO: Loading states -->
<!--      TODO: Error states -->
<!--      TODO: Refresh buttons -->
      <VCombobox label="Media title"
                 :messages='["Click to see examples. The event name and video label will be included in the final title as well."]'
                 :items="mediaTitleDefaults"
                 persistent-hint
                 rounded
                 variant="outlined"
                 v-model="eventMediaStore.mediaTitle"
                 class="mb-4"
      />

      <VAutocomplete
        variant="outlined"
        rounded
        label="Video file"
        :items="eventMediaStore.videoFilePaths"
        v-model="eventMediaStore.selectedVideoFilePath"
      ></VAutocomplete>

      <h3 class="mb-2">
        Description
      </h3>
      <VideoDescription :error="eventMediaStore.descriptionFetchError"
                        :showInput="!!eventMediaStore.mediaTitle"
                        :loading="eventMediaStore.descriptionLoading"
                        v-model="eventMediaStore.description"
                        @onRefreshDescription="eventMediaStore.getSuggestedDescription"
      />
    </VCol>
    <VCol
      cols="12"
      :md="videosMdColWidth"
    >
      <h2 class="mb-2">
        Video
      </h2>
      <VRow>
        <VSheet class="d-flex flex-wrap">
          <VSheet
            v-for="video in eventMediaStore.videoCandidates"
            :key="video.path"
            class="pa-3 video-preview"
          >
            <h3>{{ video.videoLabel ?? "Unlabeled" }}</h3>
            <VAlert
              v-if="isVideoMissingPlaylistMapping(video)"
              density="compact"
              class="mb-2"
              variant="tonal"
              color="warning"
            >
              Missing playlist mapping
            </VAlert>
            <video
              :src="`videos/${video.path}`"
              controls
              preload="metadata"
            />
          </VSheet>
        </VSheet>
      </VRow>
      <VRow>
<!--       FIXME: MatchVideosUploader should maybe be converted to a generic video uploader -->
        <p>TODO: Video uploader</p>
<!--        <MatchVideosUploader />-->
      </VRow>
      <VRow>
        <VCol>
          <h2 class="mb-2">
            Help
          </h2>
          <VExpansionPanels>
<!--            FIXME: Update help content for this -->
<!--            <NameMatchVideoFilesHelp />-->
<!--            <MissingMatchVideosHelp />-->
<!--            <MissingPlaylistMapping />-->
<!--            <UploadErrors />-->
          </VExpansionPanels>
        </VCol>
      </VRow>
    </VCol>
    <VCol
      v-if="workerStore.jobsForTask(UPLOAD_VIDEO_TASK).length"
      cols="12"
      md="4"
    >
      <h2>Upload queue</h2>
      <JobsList
        :jobs-list="workerStore.jobsListAsQueue"
        :included-tasks="[UPLOAD_VIDEO_TASK]"
      />
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import {computed, ref} from "vue";
import {usePlaylistsStore} from "@/stores/playlists";
import JobsList from "@/components/jobs/JobsList.vue";
import {useWorkerStore} from "@/stores/worker";
import { UPLOAD_VIDEO_TASK } from "@/types/WorkerJob";
import { VideoInfo } from "@/types/VideoInfo";
import { useEventMediaStore } from "@/stores/eventMedia";
import VideoDescription from "@/components/videos/VideoDescription.vue";

const error = ref("");

const eventMediaStore = useEventMediaStore();
eventMediaStore.getVideoFiles();
const playlistStore = usePlaylistsStore();
const workerStore = useWorkerStore();
workerStore.loadJobs();

const mediaTitleDefaults = ref([
  "Day # Opening Ceremonies",
  "Alliance Selection",
  "Day # Awards Ceremony Part #",
  "Day # Closing Ceremonies",
])

const videosMdColWidth = computed(() => {
  if (workerStore.jobsList.length) {
    return 4;
  } else {
    return 6;
  }
});

function isVideoMissingPlaylistMapping(video: VideoInfo) {
  if (!video.videoLabel) {
    return !playlistStore.playlistMappings["unlabeled"];
  }

  return !playlistStore.playlistMappings[video.videoLabel.toLowerCase()];
}

</script>

<style scoped>
.video-preview {
  max-width: 25rem;
}

/* https://css-tricks.com/fluid-width-video/ */
video {
  /* override other styles to make responsive */
  width: 100% !important;
  height: auto !important;
}
</style>
