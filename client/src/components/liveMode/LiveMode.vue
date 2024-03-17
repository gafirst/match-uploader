<template>
  <VCard class="mt-2 mb-2"
         variant="outlined"
         color="purple"
  >
    <VCardTitle><VIcon icon="mdi-clock-fast" class="mr-2" />Live mode is available</VCardTitle>
    <VCardText style="color: initial">
      <p class="mb-2">
        Match Uploader will watch for video files and automatically trigger uploads once all expected video files are
        found.
      </p>
      <p class="mb-2">
        To make Live Mode wait for a video file, add a playlist mapping for its label (reminder: the label for video
        files without an explicit label is <code>unlabeled</code>.
      </p>
      <VAlert v-if="!liveMode.allowLiveMode"
              variant="tonal"
              color="info"
              class="mb-2"
      >
        Live Mode is unavailable.
      </VAlert>
      <!--      <VBtn @click="liveMode.resume">Start Live Mode</VBtn>-->
      <!--      <VBtn @click="liveMode.pause">Stop Live Mode</VBtn>-->
      <p>Live Mode state: {{ liveMode.isActive }}</p>
      <p>Live Mode status: {{ liveMode.state }}</p>
      <VBtn @click="liveMode.activate">Activate</VBtn>
      <VBtn @click="liveMode.triggerImmediateTick">Check now</VBtn>
    </VCardText>
  </VCard>
</template>
<script lang="ts" setup>
import { useLiveModeStore } from "@/stores/liveMode";

const liveMode = useLiveModeStore();
</script>
