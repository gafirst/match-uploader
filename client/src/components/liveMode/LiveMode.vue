<template>
  <VCard class="mt-2 mb-2"
         variant="outlined"
         color="purple"
  >
    <VCardTitle><VIcon icon="mdi-clock-fast" class="mr-2" />Live mode is available</VCardTitle>
    <VCardText style="color: initial">
      <p class="mb-2">
        Match Uploader will watch for video files and automatically trigger uploads once all required videos are
        present.
      </p>
      <p class="mb-2">Video labels are required for upload if a playlist mapping is defined for them.</p>
      <p v-if="!liveMode.allowLiveMode" class="mb-2">
        Live Mode can't be enabled right now.
      </p>
      <VBtn @click="liveMode.resume">Start Live Mode</VBtn>
      <VBtn @click="liveMode.pause">Stop Live Mode</VBtn>
      <p>Live Mode state: {{ liveMode.isActive }}</p>
      <p>Live Mode status: {{ liveMode.state }}</p>
      <VBtn @click="liveMode.triggerImmediateTick">Check now</VBtn>
    </VCardText>
  </VCard>
</template>
<script lang="ts" setup>
import { useLiveModeStore } from "@/stores/liveMode";

const liveMode = useLiveModeStore();
</script>
