<template>
  <h1>Match upload status</h1>
  <VDataTable
    :items="items"
    items-per-page="-1"
    density="compact"
    :headers="headers"
    hide-default-footer
  >
    <template #item.status="{ item }">
      <VChip
        :color="statusColor(item.status)"
        density="compact"
      >
        {{ item.status }}
      </VChip>
    </template>

    <template
      v-for="playlist in (playlistStore.playlists ?? []).map(playlist => playlist.label)"
      #[`item.${playlist}`]="{ item }"
      :key="playlist"
    >
      <VIcon
        v-if="item.statusByLabel[playlist].success"
        icon="mdi-cloud-check-variant"
        color="success"
      />
      <VIcon
        v-else
        icon="mdi-alert-circle"
        color="error"
      />
    </template>
  </VDataTable>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { capitalizeFirstLetter } from "@/util/capitalize";
import { useUploadedVideosStore } from "@/stores/uploadedVideos";
import { usePlaylistsStore } from "@/stores/playlists";

const playlistStore = usePlaylistsStore();

const uploadedVideosStore = useUploadedVideosStore();
playlistStore.getPlaylists();
uploadedVideosStore.getMatchUploadStatuses();

function statusColor(status: string) {
  if (status === "Not started") {
    return "error";
  }
  if (status === "Partial") {
    return "warning";
  }
  if (status === "Complete") {
    return "success";
  }
}

const headers = computed(() => [
  { key: "matchName", title: "Match" },
  { key: "status", title: "Upload status" },
  {
    title: "By label",
    align: "center",
    children: (playlistStore.playlists ?? []).map(playlist => ({
        key: playlist.label,
        title: capitalizeFirstLetter(playlist.label),
      }),
    ),
  },
]);

// Wrapping uploadedVideosStore.matchUploadStatuses in computed() is necessary to ensure that the table re-renders
// when the store's state changes.
const items = computed(() => uploadedVideosStore.matchUploadStatuses);

// const items = ref([
//   { match: "Qualification 1", status: "Partial", statusByLabel: { "unlabeled": false, "overhead": true } },
//   { match: "Qualification 2", status: "Complete", statusByLabel: { "unlabeled": true, "overhead": true } },
//   { match: "Qualification 3", status: "Not started", statusByLabel: { "unlabeled": false, "overhead": false } },
//   { match: "Playoff 1", status: "Complete", statusByLabel: { "unlabeled": true, "overhead": true } },
//   { match: "Playoff 2", status: "Partial", statusByLabel: { "unlabeled": true, "overhead": false } },
//   { match: "Playoff 3", status: "Not started", statusByLabel: { "unlabeled": false, "overhead": false } },
// ]);
</script>
