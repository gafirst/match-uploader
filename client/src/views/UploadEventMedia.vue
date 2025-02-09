<template>
  <VRow>
    <VCol
      cols="12"
      md="4"
    >
      <h1>Upload event media</h1>
      <VAlert
        v-if="!!error"
        color="error"
      >
        {{ error }}
      </VAlert>

      <h2 class="mb-2">
        File  info
      </h2>
<!--      <MatchSelector />-->

      <h2 class="mb-2">
        File metadata
      </h2>
      <MatchMetadata />
      <h3 class="mb-2">
        Description
      </h3>
<!--      <MatchDescription />-->
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
import MatchSelector from "@/components/matches/MatchSelector.vue";
import MatchVideosUploader from "@/components/matches/MatchVideosUploader.vue";
import {useMatchStore} from "@/stores/match";
import MatchDescription from "@/components/matches/MatchDescription.vue";
import NameMatchVideoFilesHelp from "@/components/help/NameMatchVideoFilesHelp.vue";
import MissingMatchVideosHelp from "@/components/help/MissingMatchVideosHelp.vue";
import {usePlaylistsStore} from "@/stores/playlists";
import UploadErrors from "@/components/help/UploadErrors.vue";
import MissingPlaylistMapping from "@/components/help/MissingPlaylistMapping.vue";
import JobsList from "@/components/jobs/JobsList.vue";
import {useWorkerStore} from "@/stores/worker";
import MatchMetadata from "@/components/matches/MatchMetadata.vue";
import LiveMode from "@/components/liveMode/LiveMode.vue";
import { UPLOAD_VIDEO_TASK } from "@/types/WorkerJob";
import { MatchVideoInfo } from "@/types/MatchVideoInfo";

const error = ref("");

const matchStore = useMatchStore();
const playlistStore = usePlaylistsStore();
const workerStore = useWorkerStore();
workerStore.loadJobs();

const videosMdColWidth = computed(() => {
  if (workerStore.jobsList.length) {
    return 4;
  } else {
    return 6;
  }
});

function isVideoMissingPlaylistMapping(video: MatchVideoInfo) {
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
