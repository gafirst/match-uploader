<template>
  <VAlert
    v-if="!settingsStore.isFirstLoad && settingsStore.settings?.youTubeVideoPrivacy !== 'public'"
    color="warning"
    variant="tonal"
    density="comfortable"
    :rounded="props.rounded ?? 0"
    icon="mdi-eye-off"
  >
    <template #text>
      <strong>Uploads are not public.</strong> YouTube upload privacy is currently set to
      {{ settingsStore.settings?.youTubeVideoPrivacy }}.
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
