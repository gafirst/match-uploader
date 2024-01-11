<template>
  <VRow>
    <VCol>
      <h1>Worker queue</h1>

      <h2>Pending jobs</h2>
      <p v-if="workerStore.jobsLoading">
        Loading...
        <!-- TODO: make this a spinner -->
      </p>
      <VAlert v-if="!workerStore.jobsList.length">
        <p>No pending, started, or retryable failed jobs currently</p>
      </VAlert>
      <VList>
        <div v-for="job in workerStore.jobsList" :key="job.jobId">
          <VListItem :title="`${job.task} - ${job.title}`"
                     :subtitle="`ID: ${job.jobId} | Status: ${job.status.toLowerCase()}`"
          >
            <template v-slot:prepend>
              <VIcon v-if="job.status === 'COMPLETED'" color="success">mdi-check-circle</VIcon>
              <VIcon v-else-if="job.status === 'FAILED' || job.status === 'FAILED_RETRYABLE'" color="error">
                mdi-alert
              </VIcon>
              <VIcon v-else>mdi-progress-upload</VIcon>
            </template>
          </VListItem>
        </div>
      </VList>

      <h2>Raw event log</h2>
      <p>This list is lost when you refresh the page.</p>
      <VAlert v-if="!workerStore.events.length">
        <p>No worker events</p>
      </VAlert>
      <VList>
        <div v-for="event in workerStore.events" :key="`${event.workerEvent}-${workerStore.jobs.get(event.jobId)?.jobId}`">
          <div v-if="event.workerEvent === WORKER_JOB_CREATED">
            <VListItem :title="`${workerStore.jobs.get(event.jobId)?.title} created`"
                       :subtitle="`Job ID: ${event.jobId}`"
                       prepend-icon="mdi-progress-upload"
            />
          </div>
          <div v-else-if="event.workerEvent === WORKER_JOB_START">
            <VListItem :title="`${workerStore.jobs.get(event.jobId)?.title} started`"
                       :subtitle="`Job ID: ${event.jobId}`"
                       prepend-icon="mdi-progress-upload"
            />
          </div>
          <div v-else-if="event.workerEvent === WORKER_JOB_COMPLETE">
            <VListItem>
              <VListItemTitle>{{ workerStore.jobs.get(event.jobId)?.title }} finished</VListItemTitle>
              <!--               FIXME: add better error handling for null status below -->
              <VListItemSubtitle>Result: {{ workerJobStatusToUiString(workerStore.jobs.get(event.jobId)?.status ?? WorkerJobStatus.PENDING) }} | Job ID: {{ event.jobId }}</VListItemSubtitle>
              <template v-slot:prepend>
                <VIcon v-if="workerStore.jobHasStatus(event.jobId, WorkerJobStatus.COMPLETED)" color="success">mdi-check-circle</VIcon>
                <VIcon v-else :color="error">mdi-alert</VIcon>
              </template>
            </VListItem>
          </div>
        </div>
      </VList>
    </VCol>
  </VRow>
</template>
<script lang="ts" setup>
import {useWorkerStore} from "@/stores/worker";
import {
  WORKER_JOB_COMPLETE,
  WORKER_JOB_CREATED,
  WORKER_JOB_START,
  WorkerJobStatus,
  workerJobStatusToUiString,
} from "@/types/WorkerJob";

const workerStore = useWorkerStore();
workerStore.loadJobs(); // FIXME: We should probably load this on app init

</script>
