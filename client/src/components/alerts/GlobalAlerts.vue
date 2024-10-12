<template>
  <div class="mt-64">
    <YouTubeAuthIncompleteAlert />
    <SandboxModeAlert />
    <PrivateUploads />
    <NoPlaylistMappings />
    <FrcEventsWarning />
    <LiveModeActivated />
    <AutoRenameEnabled />
  </div>
</template>

<script setup lang="ts">
import SandboxModeAlert from "@/components/alerts/SandboxModeAlert.vue";
import YouTubeAuthIncompleteAlert from "@/components/alerts/YouTubeAuthIncompleteAlert.vue";
import NoPlaylistMappings from "@/components/alerts/NoPlaylistMappings.vue";
import PrivateUploads from "@/components/alerts/PrivateUploads.vue";
import FrcEventsWarning from "@/components/alerts/FrcEventsWarning.vue";
import AutoRenameEnabled from "@/components/alerts/AutoRenameEnabled.vue";
import LiveModeActivated from "@/components/alerts/LiveModeActivated.vue";
</script>
