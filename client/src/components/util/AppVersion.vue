<template>
  <VChip
    v-if="releaseVersion"
    class="ml-2"
  >
    {{ releaseVersion }}
  </VChip>
</template>

<script setup lang="ts">
// To test this component, create a .env file in `client/` that sets the VITE_RELEASE_VERSION environment variable.
const releaseVersion = import.meta.env.VITE_RELEASE_VERSION;
</script>

<style scoped>

</style>
