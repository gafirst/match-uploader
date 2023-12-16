<template>
  <VRow>
    <VCol cols="12" md="5">
      <h1>Worker queue</h1>
      <VAlert v-if="!workerStore.events.length">
        <p>No worker events</p>
      </VAlert>
      <h2>Jobs</h2>
      <p>
        Currently we don't have a way to get jobs in progress through the API, so this only shows status that we can
        deduce from worker events.
      </p>
      <!--      TODO-->

      <h2>Raw event log</h2>
      <p>This list is lost when you refresh the page.</p>
      <VList>
        <div v-for="event in workerStore.events" :key="event.id">
          <div v-if="event.event === 'worker:job:start'">
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
</script>
