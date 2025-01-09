<template>
  <div v-if="matchStore.selectedMatchKey">
    <VSwitch
      v-model="matchStore.isReplay"
      color="primary"
      label="Replay"
      :loading="matchStore.descriptionLoading || matchStore.matchVideosLoading"
      :disabled="matchStore.descriptionLoading || matchStore.matchVideosLoading"
      inset
    />
  </div>
</template>
<script lang="ts" setup>
import { useMatchStore } from "@/stores/match";

const matchStore = useMatchStore();
</script>
<style scoped>
  :deep(.v-label) {
    opacity: 1;
  }
</style>
