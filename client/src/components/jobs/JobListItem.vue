<template>
  <!-- FIXME: 1) can we merge this with MatchVideoListItem somehow, 2) this needs to show post-upload step statuses -->
  <VListItem>
    <VListItemTitle class="text-wrap">
      <strong>#{{ job.jobId }}</strong> {{ job.task }}: {{ job.title }}
    </VListItemTitle>
    <VListItemSubtitle>{{ subtitle }}</VListItemSubtitle>
    <template v-slot:prepend>
      <VIcon :color="iconColor" :icon="icon" />
    </template>
  </VListItem>
</template>
<script lang="ts" setup>
import {WorkerJob, WorkerJobStatus, workerJobStatusToUiString} from "@/types/WorkerJob";
import {computed} from "vue";
import {capitalizeFirstLetter} from "@/util/capitalize";

const props = defineProps<{
  job: WorkerJob
}>();

// TODO: jobs within same status should be ordered by priority, then run_at if PENDING. Else updated_at
const subtitle = computed(() => {
  let baseSubtitle = capitalizeFirstLetter(workerJobStatusToUiString(props.job.status));
  if (props.job.error) {
    return `${baseSubtitle} | ${props.job.error}`;
  }
  return baseSubtitle;
});

const icon = computed(() => {
  if (props.job.status === WorkerJobStatus.COMPLETED) {
    return "mdi-cloud-check-variant";
  } else if (props.job.status === WorkerJobStatus.FAILED) {
    return "mdi-alert-circle";
  } else if (props.job.status === WorkerJobStatus.FAILED_RETRYABLE) {
    return "mdi-cloud-refresh-variant";
  } else if (props.job.status === WorkerJobStatus.STARTED) {
    return "mdi-loading mdi-spin";
  }

  // Pending
  return "mdi-progress-upload";
});

const iconColor = computed(() => {
  if (props.job.status === "COMPLETED") {
    return "success";
  } else if (props.job.status === "FAILED") {
    return "error";
  } else if (props.job.status === "FAILED_RETRYABLE") {
    return "warning";
  }

  // Pending, started
  return "";
});

</script>
