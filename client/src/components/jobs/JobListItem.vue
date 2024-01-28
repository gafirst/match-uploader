<template>
  <!-- TODO: 1) can we merge this with MatchVideoListItem? https://github.com/gafirst/match-uploader/issues/83 -->
  <VListItem>
    <VListItemTitle class="text-wrap">
      <strong>#{{ job.jobId }}</strong> {{ job.task }}: {{ job.title }}
    </VListItemTitle>
    <VListItemSubtitle class="text-wrap force-text-wrap">{{ subtitle }}</VListItemSubtitle>
    <template v-slot:prepend>
      <VIcon :color="icon.color" :icon="icon.icon" />
    </template>
    <template v-slot:append>
      <VBtn v-if="job.youTubeVideoId"
            variant="text"
            icon="mdi-open-in-new"
            :href="`https://www.youtube.com/watch?v=${job.youTubeVideoId}`"
            target="_blank"
      />
    </template>
  </VListItem>
</template>
<script lang="ts" setup>
import { WorkerJob, WorkerJobStatus, workerJobStatusToUiString } from "@/types/WorkerJob";
import { computed } from "vue";
import { capitalizeFirstLetter } from "@/util/capitalize";

const props = defineProps<{
  job: WorkerJob
}>();

const subtitle = computed(() => {
  let baseSubtitle = capitalizeFirstLetter(workerJobStatusToUiString(props.job.status));
  if (props.job.error) {
    return `${baseSubtitle} | ${props.job.error}`;
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

// Merge the icon and iconColor computed properties into a single object (duplicate the logic here). call it `icon`
const icon = computed(() => {
  if (props.job.status === WorkerJobStatus.COMPLETED &&
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
  }

  // Pending
  return {
    icon: "mdi-progress-upload",
    color: "",
  };
});

</script>
