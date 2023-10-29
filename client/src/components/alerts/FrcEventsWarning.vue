<template>
  <VAlert v-if="!settingsStore.isFirstLoad && settingsStore.settings?.useFrcEventsApi"
          color="warning"
          variant="tonal"
          density="comfortable"
          :rounded="props.rounded ?? 0"
          icon="mdi-alert-outline"
  >
    <template v-slot:text>
      <strong>Using FRC Events API.</strong> This is not recommended unless match data is unavailable on The Blue Alliance.
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
