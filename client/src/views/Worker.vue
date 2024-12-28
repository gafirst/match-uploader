<template>
  <VRow>
    <VCol>
      <h1>Worker queue</h1>

      <h2>Queue</h2>
      <p v-if="workerStore.jobsLoading">
        Loading...
      </p>
      <VAlert v-else-if="!workerStore.jobsList.length">
        <p>No pending, started, or retryable failed jobs currently</p>
      </VAlert>
      <JobsList
        v-else
        :jobs-list="workerStore.jobsListAsQueue"
        :included-tasks="[]"
      />
    </VCol>
  </VRow>
</template>
<script lang="ts" setup>
import {useWorkerStore} from "@/stores/worker";
import JobsList from "@/components/jobs/JobsList.vue";

const workerStore = useWorkerStore();
workerStore.loadJobs(); // TODO: We should probably load this on app init

</script>
