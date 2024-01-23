<template>
  <VList>
    <div v-for="job in jobsList" :key="job.jobId">
      <JobListItem :job="job" />
    </div>
  </VList>
</template>
<script lang="ts" setup>
import {WorkerJob} from "@/types/WorkerJob";
import JobListItem from "@/components/jobs/JobListItem.vue";

const props = defineProps<{
  jobsList: WorkerJob[]
}>();
</script>
