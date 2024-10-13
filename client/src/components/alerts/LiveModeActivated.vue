<template>
  <VAlert v-if="liveModeStore.isActive"
          color="purple"
          variant="tonal"
          density="comfortable"
          :rounded="props.rounded ?? 0"
          icon="mdi-auto-fix"
  >
    <template v-slot:text>
      <strong>Live Mode is activated.</strong> Keep this tab open—Live Mode runs in your browser.
    </template>
  </VAlert>
</template>
<script lang="ts" setup>
import { useLiveModeStore } from "@/stores/liveMode";

const liveModeStore = useLiveModeStore();

interface IProps {
  rounded?: number;
}
const props = defineProps<IProps>();
</script>
