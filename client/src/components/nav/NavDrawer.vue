<template>
  <VNavigationDrawer permanent
                     expand-on-hover
                     rail
                     app
                     location="left"
  >
    <VList>
      <VListItem v-for="item in navItems"
                 :key="item.title"
                 :title="item.title"
                 :to="item.to"
                 :prepend-icon="item.icon"
      >
        <template v-slot:prepend>
          <VBadge v-if="item.badge?.show"
                  :color="item.badge.color"
                  :content="item.badge.content"
          >
            <VIcon :icon="item.icon" />
          </VBadge>
          <VIcon v-else :icon="item.icon" />
        </template>
      </VListItem>
    </VList>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import {computed, ref} from "vue";
import {INavItem} from "@/types/INavItem";
import {useWorkerStore} from "@/stores/worker";
import {WorkerJobStatus} from "@/types/WorkerJob";
import { useAutoRenameStore } from "@/stores/autoRename";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";

const workerStore = useWorkerStore();
const autoRenameStore = useAutoRenameStore();

const navItems = computed(() => {
  return [
    {
      title: "Upload",
      to: "/upload",
      icon: "mdi-cloud-upload-outline",
    },
    {
      title: "Auto rename",
      to: "/autoRename",
      icon: "mdi-auto-mode",
      badge: {
        show: autoRenameStore.associationsInStatus(
          [AutoRenameAssociationStatus.WEAK, AutoRenameAssociationStatus.FAILED],
        ).length > 0,
        color: "warning",
        content: autoRenameStore.associationsInStatus(
          [AutoRenameAssociationStatus.WEAK, AutoRenameAssociationStatus.FAILED],
        ).length,
      },
    },
    {
      title: "Worker queue",
      to: "/worker",
      icon: "mdi-tray-full",
      badge: {
        show: workerStore.numFailedJobs > 0,
        color: "error",
        content: workerStore.numFailedJobs,
      },
    },
    {
      title: "Settings",
      to: "/settings",
      icon: "mdi-cog",
    },
  ];
});
</script>

<style scoped>

</style>
