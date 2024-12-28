<template>
  <VAlert
    v-if="!settingsStore.isFirstLoad && !settingsStore.youTubeAuthState?.accessTokenStored"
    color="error"
    variant="tonal"
    :rounded="0"
    density="comfortable"
    icon="mdi-alert-circle"
  >
    <template #text>
      <strong>YouTube authentication incomplete.</strong> YouTube uploads will not work until you complete the YouTube
      setup steps in <router-link to="/settings">
        Settings
      </router-link>.
    </template>
  </VAlert>
</template>
<script lang="ts" setup>
import {useSettingsStore} from "@/stores/settings";

const settingsStore = useSettingsStore();
</script>
