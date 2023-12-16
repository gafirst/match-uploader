<template>
  <VApp>
    <VAppBar color="primary">
      <VAppBarTitle>Match Uploader</VAppBarTitle>
      <VSpacer />
      <VChip class="mr-4">
        Worker
        <template v-slot:prepend>
          <VIcon :color="socketStatusColor">mdi-circle-medium</VIcon>
        </template>
      </VChip>
    </VAppBar>

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
import {useWorkerStore} from "@/stores/worker";
import {computed} from "vue";

const workerStore = useWorkerStore();

const socketStatusColor = computed(() => {
  if (workerStore.isConnected) {
    return "#32CD32";
  } else {
    return "error";
  }
});
</script>
