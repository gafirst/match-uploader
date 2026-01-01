<template>
  <VNavigationDrawer
    permanent
    expand-on-hover
    rail
    app
    location="left"
  >
    <VList>
      <VListItem
        v-for="item in navItems"
        :key="item.title"
        :title="item.title"
        :to="item.to"
        :prepend-icon="item.icon"
      >
        <template #prepend>
          <VBadge
            v-if="item.badge?.show"
            :color="item.badge.color"
            :content="item.badge.content"
            :dot="item.badge.dot"
          >
            <VIcon :icon="item.icon" />
          </VBadge>
          <VIcon
            v-else
            :icon="item.icon"
          />
        </template>
      </VListItem>
    </VList>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import {useWorkerStore} from "@/stores/worker";
import { useAutoRenameStore } from "@/stores/autoRename";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";
import { useLiveModeStore } from "@/stores/liveMode";
import { LiveModeStatus } from "@/types/liveMode/LiveModeStatus";
import { useSettingsStore } from "@/stores/settings";

const workerStore = useWorkerStore();
const autoRenameStore = useAutoRenameStore();
const liveModeStore = useLiveModeStore();
const settingsStore = useSettingsStore();
autoRenameStore.getAssociations();

const liveModeDotColor = computed(() => {
  if (!liveModeStore.isActive) {
    return "";
  }

  if ([LiveModeStatus.ERROR, LiveModeStatus.STOPPED].includes(liveModeStore.state)) {
    return "error";
  }

  if (liveModeStore.state === LiveModeStatus.WAITING && liveModeStore.error) {
    return "error";
  }

  if (liveModeStore.missingPlaylistLabels.length > 0) {
    return "warning";
  }

  return "success";
});

const autoRenameBadge = computed(() => {
  const numAssociationsToReview = autoRenameStore.associationsInStatus(
    [AutoRenameAssociationStatus.WEAK, AutoRenameAssociationStatus.FAILED],
  ).length;

  if (numAssociationsToReview > 0) {
    return {
      show: true,
      color: "warning",
      content: numAssociationsToReview,
    };
  }

  if (!settingsStore.isFirstLoad && settingsStore.settings?.autoRenameEnabled) {
    return {
      show: true,
      color: "success",
      dot: true,
    };
  }

  return {
    show: false,
  };
});

const navItems = computed(() => {
  return [
    {
      title: "Match video upload",
      to: "/upload-match",
      icon: "mdi-cloud-upload-outline",
      badge: {
        show: liveModeStore.isActive,
        color: liveModeDotColor.value,
        dot: true,
      },
    },
    {
      title: "Event media upload",
      to: "/upload-event-media",
      icon: "mdi-file-upload-outline",
    },
    {
      title: "Auto rename",
      to: "/autoRename",
      icon: "mdi-auto-mode",
      badge: autoRenameBadge.value,
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
      title: "Reports",
      to: "/reports",
      icon: "mdi-chart-box-multiple-outline",
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
