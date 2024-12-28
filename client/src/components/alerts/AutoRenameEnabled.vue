<template>
  <VAlert
    v-if="!settingsStore.isFirstLoad && settingsStore.settings?.autoRenameEnabled"
    color="success"
    variant="tonal"
    density="comfortable"
    :rounded="props.rounded ?? 0"
    icon="mdi-auto-mode"
  >
    <template #text>
      <strong>Auto Rename is enabled.</strong> It triggers every 5 minutes and continues running until you disable it,
      even if you close this page.
    </template>
  </VAlert>
</template>
<script lang="ts" setup>
import {useSettingsStore} from "@/stores/settings";

const settingsStore = useSettingsStore();
settingsStore.getSettings();

interface IProps {
  rounded?: number;
}
const props = defineProps<IProps>();
</script>
