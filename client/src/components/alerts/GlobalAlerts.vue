<template>
  <div class="mt-64">
    <YouTubeAuthIncompleteAlert />
    <SandboxModeAlert />
    <PrivateUploads />
    <NoPlaylistMappings />
  </div>
</template>

<script setup lang="ts">
import SandboxModeAlert from "@/components/alerts/SandboxModeAlert.vue";
import YouTubeAuthIncompleteAlert from "@/components/alerts/YouTubeAuthIncompleteAlert.vue";
import NoPlaylistMappings from "@/components/alerts/NoPlaylistMappings.vue";
import PrivateUploads from "@/components/alerts/PrivateUploads.vue";
</script>
