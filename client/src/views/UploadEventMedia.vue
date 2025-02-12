<template>
  <VRow>
    <VCol
      cols="12"
      md="4"
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
      <VCombobox label="Media title"
                 :messages='["Click to see examples. The event name and other info will be included in the final title as well."]'
                 :items="mediaTitleDefaults"
                 persistent-hint
                 rounded
                 clearable
                 variant="outlined"
                 v-model="eventMediaStore.mediaTitle"
                 class="mb-2"
                 @click:clear="() => eventMediaStore.description = ''"
      />

      <VAutocomplete
        chips
        variant="outlined"
        rounded
        label="Select video files..."
        :items="eventMediaStore.videoCandidates.map((video => video.path))"
        v-model="eventMediaStore.selectedVideoFilePaths"
        multiple
        clearable
      ></VAutocomplete>

<!--      <MatchSelector />-->

<!--      <h2 class="mb-2">-->
<!--        File metadata-->
<!--      </h2>-->
<!--      <MatchMetadata />-->
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
        Videos
      </h2>
<!--      FIXME: This part of matchStore could be converted into a generic store holding infos about videos to be uploaded / being uploaded-->
<!--      <VRow>-->
<!--        <VSheet class="d-flex flex-wrap">-->
<!--          <VSheet-->
<!--            v-for="video in matchStore.matchVideos"-->
<!--            :key="video.path"-->
<!--            class="pa-3 video-preview"-->
<!--          >-->
<!--            <h3>{{ video.videoLabel ?? "Unlabeled" }}</h3>-->
<!--            <VAlert-->
<!--              v-if="isVideoMissingPlaylistMapping(video)"-->
<!--              density="compact"-->
<!--              class="mb-2"-->
<!--              variant="tonal"-->
<!--              color="warning"-->
<!--            >-->
<!--              Missing playlist mapping-->
<!--            </VAlert>-->
<!--            <video-->
<!--              :src="`videos/${video.path}`"-->
<!--              controls-->
<!--              preload="metadata"-->
<!--            />-->
<!--          </VSheet>-->
<!--        </VSheet>-->
<!--      </VRow>-->
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
import VideoDescription from "@/components/form/VideoDescription.vue";

const error = ref("");

const eventMediaStore = useEventMediaStore();
eventMediaStore.getVideoCandidates("Test title");
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
  max-width: 12.25rem;
}

/* https://css-tricks.com/fluid-width-video/ */
video {
  /* override other styles to make responsive */
  width: 100% !important;
  height: auto !important;
}
</style>
