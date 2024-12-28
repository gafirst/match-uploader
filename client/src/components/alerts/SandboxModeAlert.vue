<template>
  <VAlert
    v-if="!settingsStore.isFirstLoad && settingsStore.settings?.sandboxModeEnabled"
    color="warning"
    variant="tonal"
    density="comfortable"
    :rounded="props.rounded ?? 0"
    icon="mdi-upload-off"
  >
    <template #text>
      <strong>Sandbox mode enabled.</strong> No videos will be uploaded to YouTube.
    </template>
  </VAlert>
</template>
<script lang="ts" setup>
import {useSettingsStore} from "@/stores/settings";

const settingsStore = useSettingsStore();
settingsStore.getSettings(); // TODO: We should probably load this on app init

interface IProps {
  rounded?: number;
}
const props = defineProps<IProps>();
</script>
