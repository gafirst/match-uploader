<template>
  <div v-if="matchStore.selectedMatchKey">
    <VSwitch v-model="matchStore.isReplay"
             color="primary"
             label="Replay"
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
