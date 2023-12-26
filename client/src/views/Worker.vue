<template>
  <VRow>
    <VCol cols="12" md="5">
      <h1>Worker queue</h1>

      <h2>Pending jobs</h2>
      <p v-if="workerStore.jobsLoading">
        Loading...
        <!-- TODO: make this a spinner -->
      </p>
      <VAlert v-if="!workerStore.jobs.length">
        <p>No pending, started, or retryable failed jobs currently</p>
      </VAlert>
      <VList>
        <div v-for="job in workerStore.jobs" :key="job.jobId">
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
        <div v-for="event in workerStore.events" :key="event.id">
          <div v-if="event.event === 'worker:job:created'">
            <VListItem :title="`${event.jobName} created`"
                       :subtitle="`Job ID: ${event.jobId}`"
                       prepend-icon="mdi-progress-upload"
            />
          </div>
          <div v-else-if="event.event === 'worker:job:start'">
            <VListItem :title="`${event.jobName} started`"
                       :subtitle="`Job ID: ${event.jobId}`"
                       prepend-icon="mdi-progress-upload"
            />
          </div>
          <div v-else-if="event.event === 'worker:job:complete'">
            <VListItem>
              <VListItemTitle>{{ event.jobName }} finished</VListItemTitle>
              <VListItemSubtitle>Result: {{ event.statusDescription }} | Job ID: {{ event.jobId }}</VListItemSubtitle>
              <template v-slot:prepend>
                <VIcon v-if="event.statusDescription === 'success'" color="success">mdi-check-circle</VIcon>
                <VIcon v-else :color="event.statusDescription">mdi-alert</VIcon>
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

const workerStore = useWorkerStore();
workerStore.loadJobs(); // FIXME: We should probably load this on app init

</script>
