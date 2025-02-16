<template>
  <VRow>
    <VCol
      cols="12"
      md="5"
    >
      <h1 class="mb-2">Upload event media <VChip color="purple">Beta</VChip></h1>
      <VAlert
        color="purple"
        variant="tonal"
        class="mb-4"
        density="compact"
        icon="mdi-bug-outline"
      >
        Report bugs and send feedback
        <a
          target="_blank"
          href="https://github.com/gafirst/match-uploader/issues/new/choose"
        >on GitHub</a>.
      </VAlert>
      <VAlert
        v-if="!!eventMediaStore.error"
        variant="tonal"
        color="error"
        class="mb-2"
      >
        {{ eventMediaStore.error }}
      </VAlert>

      <p class="mb-2">
        Current event code: {{ settingsStore.settings?.eventTbaCode ?? "Loading..." }}
      </p>

      <VAlert
        v-if='eventMediaStore.mediaTitle?.includes("#")'
        variant="tonal"
        color="warning"
        class="mb-4"
        icon="mdi-pound"
      >
        Psst! Make sure to replace all # signs in the media title with the actual number.
      </VAlert>
      <VCombobox label="Media title"
                 :messages='["Click to see examples. The event name and video label will be included in the final title as well."]'
                 :items="mediaTitleDefaults"
                 persistent-hint
                 rounded
                 variant="outlined"
                 v-model="eventMediaStore.mediaTitle"
                 class="mb-4"
                 :disabled="jobQueueInProgress"
      />

      <VAutocomplete
        variant="outlined"
        rounded
        label="Video file"
        :items="eventMediaStore.videoFilePaths"
        v-model="eventMediaStore.selectedVideoFilePath"
        :disabled="!eventMediaStore.mediaTitle || jobQueueInProgress"
        :loading="eventMediaStore.videoFilesLoading"
      />

      <VBtn
        class="mb-4"
        variant="outlined"
        prepend-icon="mdi-refresh"
        :loading="eventMediaStore.videoFilesLoading"
        :disabled="jobQueueInProgress"
        @click="eventMediaStore.getVideoFiles"
      >
        Refresh video files
      </VBtn>

      <h3 class="mb-2">
        Description
      </h3>
      <VideoDescription :error="eventMediaStore.descriptionFetchError"
                        :showInput="!!eventMediaStore.mediaTitle"
                        :loading="eventMediaStore.descriptionLoading"
                        :input-disabled="jobQueueInProgress"
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
        <VCard class="ml-4 mt-2 mb-2">
          <VCardTitle>Videos to upload</VCardTitle>
          <VCardText>
            <LoadingSpinner
              v-if="eventMediaStore.videoToUploadLoading"
              class="mt-2 mb-4"
            />
            <VAlert class="mb-2" density="compact" variant="tonal" color="info" v-else-if="!eventMediaStore.selectedVideoFile">Nothing to upload</VAlert>
            <MatchVideoListItem
              v-else
              :video="eventMediaStore.selectedVideoFile"
              hide-upload-btn
              class="mb-2"
            />
            <div>
              <VBtn
                prepend-icon="mdi-refresh"
                variant="outlined"
                class="mb-2"
                :disabled="uploadInProgress || disableUploadButton"
                @click="eventMediaStore.getVideoMetadata"
              >
                Refresh
              </VBtn>
            </div>
            <VBtn
              size="large"
              @click="eventMediaStore.triggerUpload"
              :disabled="uploadInProgress || disableUploadButton"
            >
              Queue upload
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
      </VRow>
    </VCol>
    <VCol
      v-if="workerStore.jobsForTask(UPLOAD_VIDEO_TASK).length"
      cols="12"
      md="3"
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
import { computed, ref } from "vue";
import { usePlaylistsStore } from "@/stores/playlists";
import JobsList from "@/components/jobs/JobsList.vue";
import { useWorkerStore } from "@/stores/worker";
import { UPLOAD_VIDEO_TASK, WorkerJobStatus } from "@/types/WorkerJob";
import { VideoInfo } from "@/types/VideoInfo";
import { useEventMediaStore } from "@/stores/eventMedia";
import VideoDescription from "@/components/videos/VideoDescription.vue";
import MatchVideoListItem from "@/components/matches/MatchVideoListItem.vue";
import { useSettingsStore } from "@/stores/settings";
import LoadingSpinner from "@/components/util/LoadingSpinner.vue";
import PrivateUploads from "@/components/alerts/PrivateUploads.vue";
import SandboxModeAlert from "@/components/alerts/SandboxModeAlert.vue";

const eventMediaStore = useEventMediaStore();
eventMediaStore.getVideoFiles();
const playlistStore = usePlaylistsStore();
const workerStore = useWorkerStore();
workerStore.loadJobs();
const settingsStore = useSettingsStore();

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

const disableUploadButton = computed(() => {
  if (eventMediaStore.videoFilesLoading
    || eventMediaStore.descriptionLoading
    || eventMediaStore.videoToUploadLoading
    || !eventMediaStore.selectedVideoFile
    || eventMediaStore.selectedVideoFile?.isRequestingJob
    || eventMediaStore.selectedVideoFile?.isUploaded) {
    return true;
  }

  if (eventMediaStore.selectedVideoFile?.workerJobId) {
    return workerStore.jobHasStatus(eventMediaStore.selectedVideoFile.workerJobId, WorkerJobStatus.COMPLETED);
  }

  return false;
});

const jobQueueInProgress = computed(() => {
  return eventMediaStore.selectedVideoFile?.isRequestingJob;
});

const uploadInProgress = computed(() => {
  if (eventMediaStore.selectedVideoFile?.workerJobId) {
    return !workerStore.jobHasStatus(eventMediaStore.selectedVideoFile.workerJobId, [WorkerJobStatus.COMPLETED, WorkerJobStatus.FAILED]);
  }

  return false;
});

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
