<template>
  <VApp>
    <VAppBar color="primary" title="Match Uploader" />
    <NavDrawer />
    <VMain>
      <VContainer>
        <RouterView />
      </VContainer>
    </VMain>
  </VApp>
</template>

<script lang="ts" setup>
import NavDrawer from "@/components/nav/NavDrawer.vue";
</script>
