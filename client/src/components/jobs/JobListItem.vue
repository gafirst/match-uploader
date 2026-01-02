<template>
  <!-- TODO: 1) can we merge this with MatchVideoListItem? https://github.com/gafirst/match-uploader/issues/83 -->
  <VListItem>
    <VListItemTitle class="text-wrap">
      <strong>#{{ job.jobId }}</strong> {{ job.task }}{{ job.title !== "Unknown" ? `: ${job.title}` : "" }}
    </VListItemTitle>
    <VListItemSubtitle class="text-wrap force-text-wrap">
      {{ subtitle }}
    </VListItemSubtitle>
    <template #prepend>
      <VIcon
        :color="icon.color"
        :icon="icon.icon"
      />
    </template>
    <template #append>
      <VBtn
        v-if="job.youTubeVideoId"
        variant="text"
        icon="mdi-open-in-new"
        :href="`https://www.youtube.com/watch?v=${job.youTubeVideoId}`"
        target="_blank"
      />
      <VBtn
        v-else-if="[WorkerJobStatus.PENDING, WorkerJobStatus.FAILED_RETRYABLE].includes(job.status)
          && !showConfirmCancel"
        variant="text"
        color="gray"
        icon="mdi-trash-can-outline"
        @click="showConfirmCancel = true"
      />
      <VBtn
        v-else-if="[WorkerJobStatus.PENDING, WorkerJobStatus.FAILED_RETRYABLE].includes(job.status)
          && showConfirmCancel"
        variant="text"
        prepend-icon="mdi-trash-can-outline"
        color="error"
        :loading="cancelJobLoading"
        text="Cancel?"
        @click="cancelJob"
      />
    </template>
  </VListItem>
</template>
<script lang="ts" setup>
import { UPLOAD_VIDEO_TASK, WorkerJob, WorkerJobStatus, workerJobStatusToUiString } from "@/types/WorkerJob";
import { computed, ref, watch } from "vue";
import { capitalizeFirstLetter } from "@/util/capitalize";
import { useWorkerStore } from "@/stores/worker";

const props = defineProps<{
  job: WorkerJob
}>();

const workerStore = useWorkerStore();

const showConfirmCancel = ref(false);
const showConfirmTimeoutId = ref<number | null>(null);
watch(showConfirmCancel, (newVal) => {
  if (!newVal) {
    return;
  }

  showConfirmTimeoutId.value = setTimeout(() => {
    showConfirmCancel.value = false;
  }, 5000) as unknown as number; // Browsers return a number from setTimeout but TypeScript is interpreting this
  // as a Node function, see https://stackoverflow.com/a/22747243
});

const cancelJobLoading = ref(false);
async function cancelJob() {
  if (showConfirmTimeoutId.value) {
    clearTimeout(showConfirmTimeoutId.value);
  }
  cancelJobLoading.value = true;
  await workerStore.cancelJob(props.job.jobId);
  cancelJobLoading.value = false;
  showConfirmCancel.value = false;
}

const subtitle = computed(() => {
  const baseSubtitle = capitalizeFirstLetter(workerJobStatusToUiString(props.job.status));
  if (props.job.error && props.job.status !== WorkerJobStatus.CANCELLED) {
    return `${baseSubtitle} | ${props.job.error}`;
  }

  if (props.job.task !== UPLOAD_VIDEO_TASK) {
    return baseSubtitle;
  }

  let postUploadStatus = "";
  let playlistStatus = "";
  let tbaStatus = "";
  if (props.job && props.job.status === WorkerJobStatus.COMPLETED) {
    const playlist = props.job.addedToYouTubePlaylist;
    const tba = props.job.linkedOnTheBlueAlliance;

    if (playlist && tba) {
      postUploadStatus = "Post-upload steps succeeded";
    } else {
      if (!playlist) {
        playlistStatus = "Add to YouTube playlist failed";
      }

      if (!tba) {
        tbaStatus = `${playlistStatus ? " | ": ""}TBA link failed`;
      }

      postUploadStatus = `${playlistStatus}${tbaStatus}`;
    }
  }

  return `${baseSubtitle}${postUploadStatus ? " | ": ""}${postUploadStatus}`;
});

const icon = computed(() => {
  if (props.job.status === WorkerJobStatus.COMPLETED &&
    props.job.task === UPLOAD_VIDEO_TASK &&
    (!props.job.addedToYouTubePlaylist || !props.job.linkedOnTheBlueAlliance)) {
    return {
      icon: "mdi-alert-circle",
      color: "warning",
    };
  } else if (props.job.status === WorkerJobStatus.COMPLETED) {
    return {
      icon: "mdi-cloud-check-variant",
      color: "success",
    };
  } else if (props.job.status === WorkerJobStatus.FAILED) {
    return {
      icon: "mdi-alert-circle",
      color: "error",
    };
  } else if (props.job.status === WorkerJobStatus.FAILED_RETRYABLE) {
    return {
      icon: "mdi-cloud-refresh-variant",
      color: "warning",
    };
  } else if (props.job.status === WorkerJobStatus.STARTED) {
    return {
      icon: "mdi-loading mdi-spin",
      color: "",
    };
  } else if (props.job.status === WorkerJobStatus.CANCELLED) {
    return {
      icon: "mdi-cloud-cancel",
      color: "",
    }
  }

  // Pending
  return {
    icon: "mdi-progress-upload",
    color: "",
  };
});

</script>
