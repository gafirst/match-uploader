<template>
  <VListItem :title="video.videoTitle"
             class="text-wrap"
  >
    <VListItemSubtitle class="text-wrap force-text-wrap">
      {{ subtitle }}
    </VListItemSubtitle>
    <template v-slot:prepend>
      <VIcon v-if="video.isRequestingJob"
             icon="mdi-loading mdi-spin"
             size="large"
      />
      <VIcon v-else-if="!!video.jobCreationError"
             icon="mdi-alert-circle-outline"
             color="error"
             size="large"
      />
      <!-- FIXME -->
      <VIcon v-else-if="video.uploaded && !matchStore.postUploadStepsSucceeded(video)"
             icon="mdi-alert"
             color="warning"
             size="large"
      />
      <VIcon v-else-if="workerStore.jobHasStatus(video.workerJobId, WorkerJobStatus.COMPLETED)"
             icon="mdi-cloud-check-variant"
             color="success"
             size="large"
      />
      <VIcon v-else-if="workerStore.jobHasStatus(video.workerJobId, WorkerJobStatus.FAILED)"
             icon="mdi-alert"
             color="error"
             size="large"
      />
      <VIcon v-else-if="workerStore.jobHasStatus(video.workerJobId, WorkerJobStatus.STARTED)"
             icon="mdi-loading mdi-spin"
             size="large"
      />
      <VIcon v-else-if="workerStore.jobHasStatus(video.workerJobId, WorkerJobStatus.PENDING)"
             icon="mdi-tray-full"
             size="large"
      />
      <VIcon v-else
             icon="mdi-progress-upload"
             size="large"
      />
    </template>
    <template v-slot:append>
      <!-- TODO: Don't hardcode url like this -->
      <VBtn v-if="video.workerJobId && workerStore.jobs.get(video.workerJobId)?.youTubeVideoId"
            variant="text"
            icon="mdi-open-in-new"
            :href="`https://www.youtube.com/watch?v=${workerStore.jobs.get(video.workerJobId)?.youTubeVideoId}`"
            target="_blank"
      />
      <VBtn v-else-if="!!video.jobCreationError || (video.workerJobId && workerStore.jobs.get(video.workerJobId)?.status === 'FAILED')"
            variant="text"
            prepend-icon="mdi-refresh"
            :disabled="matchStore.uploadInProgress"
            @click="matchStore.uploadSingleVideo(video)"
      >
        Retry
      </VBtn>
      <VBtn v-else-if="!video.workerJobId"
            variant="text"
            prepend-icon="mdi-upload"
            :disabled="matchStore.uploadInProgress"
            @click="matchStore.uploadSingleVideo(video)"
      >
        Upload
      </VBtn>
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import {MatchVideoInfo} from "@/types/MatchVideoInfo";
import {computed} from "vue";
import {useMatchStore} from "@/stores/match";
import {useWorkerStore} from "@/stores/worker";
import {capitalizeFirstLetter} from "@/util/capitalize";
import {WorkerJobStatus} from "@/types/WorkerJob";

const matchStore = useMatchStore();
const workerStore = useWorkerStore();

interface IProps {
  video: MatchVideoInfo;
}

const props = defineProps<IProps>();

const uploadStatus = computed(() => {
  if (props.video.isRequestingJob) {
    return "Creating job";
  }

  if (props.video.jobCreationError) {
    return `Error requesting job: ${props.video.jobCreationError}`;
  }

  if (props.video.workerJobId) {
    const job = workerStore.jobs.get(props.video.workerJobId);
    if (job) {
      if (workerStore.jobHasStatus(props.video.workerJobId, WorkerJobStatus.COMPLETED)) {
        return "Uploaded";
      }

      if (workerStore.jobHasStatus(props.video.workerJobId, WorkerJobStatus.FAILED)) {
        return job.error ?? "Unknown error"; // TODO: error might not be set
      }

      if (workerStore.jobHasStatus(props.video.workerJobId, WorkerJobStatus.FAILED_RETRYABLE)) {
        const attemptsRemaining = job.maxAttempts - job.attempts;
        const plural = attemptsRemaining === 1 ? "" : "s";

        return `Failed | ${attemptsRemaining} attempt${plural} remaining | ${job.error ?? "Unknown error"}`;
      }

      if (job?.status !== WorkerJobStatus.COMPLETED) {
        return capitalizeFirstLetter(job.status);
      }
    }
  }

  return "Not uploaded";
});

const subtitle = computed(() => {
  let postUploadStatus = "";
  let playlistStatus = "";
  let tbaStatus = "";
  // FIXME
  if (props.video.postUploadSteps) {
    const playlist = props.video.postUploadSteps.addToYouTubePlaylist;
    const tba = props.video.postUploadSteps.linkOnTheBlueAlliance;

    if (playlist && tba) {
      postUploadStatus = "Post-upload steps completed | ";
    } else {
      if (!playlist) {
        playlistStatus = "Add to YouTube playlist failed | ";
      }

      if (!tba) {
        tbaStatus = "TBA link failed | ";
      }
      postUploadStatus = `${playlistStatus}${tbaStatus}`;
    }
  }
  // end FIXME

  return `${uploadStatus.value} | ${postUploadStatus}${props.video.path}`;
});
</script>
<style scoped>
/* https://stackoverflow.com/a/59769716 */
.force-text-wrap {
  -webkit-line-clamp: unset !important;
}
</style>
