<template>
  <VAlert
    v-if="!settingsStore.isFirstLoad && settingsStore.settings?.autoUploadEnabled"
    color="success"
    variant="tonal"
    density="comfortable"
    :rounded="props.rounded ?? 0"
    icon="mdi-clock-fast"
  >
    <template #text>
      <strong>Auto Upload is enabled.</strong> It will trigger periodically until disabled, even if you close this window.
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
