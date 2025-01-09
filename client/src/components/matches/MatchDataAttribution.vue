<template>
  <p
    v-if="settingsStore.settings?.useFrcEventsApi"
    class="text-caption"
  >
    <VIcon icon="mdi-information" /> <a
      target="_blank"
      href="https://frc-events.firstinspires.org/services/API"
    >
      Event Data provided by <em>FIRST</em>
    </a>
  </p>
  <p
    v-else
    class="text-caption"
  >
    <VIcon icon="mdi-information" /> <a
      target="_blank"
      href="https://thebluealliance.com"
    >
      Powered by The Blue Alliance
    </a>
  </p>
</template>
<script lang="ts" setup>
import {useSettingsStore} from "@/stores/settings";

const settingsStore = useSettingsStore();
</script>
