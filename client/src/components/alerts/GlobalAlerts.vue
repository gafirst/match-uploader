<template>
  <div class="mt-64">
    <YouTubeAuthIncompleteAlert />
    <SandboxModeAlert />
  </div>
</template>

<script setup lang="ts">
import SandboxModeAlert from "@/components/alerts/SandboxModeAlert.vue";
import YouTubeAuthIncompleteAlert from "@/components/alerts/YouTubeAuthIncompleteAlert.vue";
</script>
