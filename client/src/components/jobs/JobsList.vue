<template>
  <VAlert
    v-if="workerStore.jobCancellationError"
    class="mt-2"
    color="error"
  >
    {{ workerStore.jobCancellationError }}
  </VAlert>
  <VList>
    <div
      v-for="job in filteredJobsList"
      :key="job.jobId"
    >
      <JobListItem :job="job" />
    </div>
  </VList>
</template>
<script lang="ts" setup>
import { WorkerJob } from "@/types/WorkerJob";
import JobListItem from "@/components/jobs/JobListItem.vue";
import { useWorkerStore } from "@/stores/worker";
import { computed } from "vue";

const workerStore = useWorkerStore();

const props = defineProps<{
  jobsList: WorkerJob[],
  includedTasks: string[],
}>();

const filteredJobsList = computed(() => {
  return props.jobsList.filter(job => {
    return !props.includedTasks.length || props.includedTasks.includes(job.task);
  });
});
</script>
