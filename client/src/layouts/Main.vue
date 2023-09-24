<template>
  <VApp>
    <VAppBar color="primary" title="Match Uploader" />
    <NavDrawer />
    <VMain>
      <GlobalAlerts />
      <VContainer>
        <RouterView />
      </VContainer>
    </VMain>
  </VApp>
</template>

<script lang="ts" setup>
import NavDrawer from "@/components/nav/NavDrawer.vue";
import GlobalAlerts from "@/components/alerts/GlobalAlerts.vue";
</script>
