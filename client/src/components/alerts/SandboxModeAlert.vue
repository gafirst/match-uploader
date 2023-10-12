<template>
  <VAlert v-if="!settingsStore.isFirstLoad && settingsStore.settings?.sandboxModeEnabled"
          color="warning"
          variant="tonal"
          :rounded="props.rounded ?? 0"
          icon="mdi-upload-off"
  >
    <template v-slot:text>
      <strong>Sandbox mode enabled.</strong> No videos will be uploaded to YouTube.
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
