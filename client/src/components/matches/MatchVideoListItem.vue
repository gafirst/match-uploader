<template>
  <VListItem>
    <VListItemTitle class="text-wrap">
      {{ video.videoTitle }}
    </VListItemTitle>
    <VListItemSubtitle class="text-wrap force-text-wrap">
      {{ subtitle }}
    </VListItemSubtitle>
    <template #prepend>
      <VIcon
        :icon="icon.icon"
        :color="icon.color"
        size="large"
      />
    </template>
    <template
      #append
    >
      <VBtn
        v-if="videoJob?.youTubeVideoId"
        variant="text"
        icon="mdi-open-in-new"
        :href="`https://www.youtube.com/watch?v=${videoJob?.youTubeVideoId}`"
        target="_blank"
      />
      <VBtn
        v-else-if="!!video.jobCreationError || videoJob?.status === WorkerJobStatus.FAILED"
        variant="text"
        prepend-icon="mdi-refresh"
        :disabled="matchStore.uploadInProgress"
        @click="matchStore.uploadSingleVideo(video)"
      >
        Retry
      </VBtn>
      <VBtn
        v-else-if="!video.workerJobId && !isUploaded && !hideUploadBtn"
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
import { VideoInfo } from "@/types/VideoInfo";
import { computed } from "vue";
import { useMatchStore } from "@/stores/match";
import { useWorkerStore } from "@/stores/worker";
import { capitalizeFirstLetter } from "@/util/capitalize";
import { WorkerJobStatus } from "@/types/WorkerJob";

const matchStore = useMatchStore();
const workerStore = useWorkerStore();

interface IProps {
  video: VideoInfo;
  hideUploadBtn?: boolean;
}

const props = defineProps<IProps>();

const uploadStatus = computed(() => {
  if (props.video.isUploaded) {
    return "Uploaded";
  }

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
        return job.error ?? "Unknown error";
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

  // Check out JobListItem.vue as well, where there's some duplicated logic for displaying post-upload step statusesgit
  if (props.video.workerJobId) {
    const job = workerStore.jobs.get(props.video.workerJobId);
    if (job && job.status === WorkerJobStatus.COMPLETED) {
      const playlist = job.addedToYouTubePlaylist;
      const tba = job.linkedOnTheBlueAlliance;

      if (playlist && tba) {
        postUploadStatus = "Post-upload steps succeeded | ";
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
  }

  return `${uploadStatus.value} | ${postUploadStatus}${props.video.path}`;
});

const isUploaded = computed(() => {
  return props.video.isUploaded ||
    (props.video.workerJobId && workerStore.jobHasStatus(props.video.workerJobId, WorkerJobStatus.COMPLETED));
});

const icon = computed((): {
  icon: string;
  color: string;
} => {
  if (props.video.isUploaded) {
    return {
      icon: "mdi-cloud-check-variant",
      color: "success",
    };
  }

  if (props.video.isRequestingJob) {
    return {
      icon: "mdi-loading mdi-spin",
      color: "",
    };
  }

  if (props.video.jobCreationError) {
    return {
      icon: "mdi-alert-circle",
      color: "error",
    };
  }

  if (props.video.workerJobId) {
    if (workerStore.jobHasStatus(props.video.workerJobId, WorkerJobStatus.COMPLETED)) {
      if (!matchStore.postUploadStepsSucceeded(props.video)) {
        return {
          icon: "mdi-alert-circle",
          color: "warning",
        };
      }
      return {
        icon: "mdi-cloud-check-variant",
        color: "success",
      };
    }

    if (workerStore.jobHasStatus(props.video.workerJobId, WorkerJobStatus.FAILED)) {
      return {
        icon: "mdi-alert-circle-outline",
        color: "error",
      };
    }

    if (workerStore.jobHasStatus(props.video.workerJobId, WorkerJobStatus.STARTED)) {
      return {
        icon: "mdi-loading mdi-spin",
        color: "",
      };
    }

    if (workerStore.jobHasStatus(props.video.workerJobId, WorkerJobStatus.CANCELLED)) {
      return {
        icon: "mdi-cloud-cancel",
        color: "",
      };
    }

    if (workerStore.jobHasStatus(props.video.workerJobId, WorkerJobStatus.PENDING)) {
      return {
        icon: "mdi-tray-full",
        color: "",
      };
    }
  }

  return {
    icon: "mdi-progress-upload",
    color: "",
  };
});

const videoJob = computed(() => {
  if (props.video.workerJobId) {
    return workerStore.jobs.get(props.video.workerJobId);
  }

  return null;
});
</script>
