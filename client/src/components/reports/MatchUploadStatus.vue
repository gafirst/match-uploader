<template>
  <h1>
    Match upload status <VBtn
      prepend-icon="mdi-refresh"
      @click="refreshData"
    >
      Refresh
    </VBtn>
  </h1>
  <p
    v-if="uploadedVideosStore.eventKey"
    class="mb-2"
  >
    <strong>Event code:</strong> {{ uploadedVideosStore.eventKey }}
  </p>
  <VRow
    v-if="!!playlistsStore.error || !!uploadedVideosStore.error"
    class="mt-1"
  >
    <VCol>
      <VAlert
        v-if="!!playlistsStore.error"
        variant="tonal"
        color="error"
        class="mb-2"
      >
        {{ playlistsStore.error }}
      </VAlert>

      <VAlert
        v-if="!!uploadedVideosStore.error"
        variant="tonal"
        color="error"
        class="mb-2"
      >
        {{ uploadedVideosStore.error }}
      </VAlert>
    </VCol>
  </VRow>
  <VRow
    v-if="playlistsStore.playlistMappingsExist"
    class="ml-1 mb-2"
  >
    <VCol
      md="3"
    >
      <p>
        <VIcon color="success">
          mdi-cloud-check-variant
        </VIcon> Video uploaded
      </p>
      <p>
        <VIcon
          color="error"
        >
          mdi-cloud-outline
        </VIcon> No video uploaded
      </p>
    </VCol>
    <VCol
      v-if="uploadedVideosStore.matchUploadStatusTotals"
      md="3"
    >
      <VProgressLinear
        :model-value="uploadedVideosStore.completedPercent * 100"
        rounded
        height="10"
        :color="progressBarColor"
        style="max-width: 150px"
        class="mb-2"
      />
      {{ uploadedVideosStore.matchUploadStatusTotals.completed }} of
      {{ uploadedVideosStore.matchUploadStatusTotals.total }}
      match{{ uploadedVideosStore.matchUploadStatusTotals.total != 1 ? "es" : "" }} uploaded
    </VCol>
  </VRow>

  <VAlert
    v-if="!playlistsStore.playlistMappingsExist"
    color="warning"
    variant="tonal"
    icon="mdi-alert-circle-outline"
  >
    To use this report, define at least one playlist mapping in <RouterLink to="/settings">
      Settings
    </RouterLink>.
  </VAlert>
  <VDataTable
    v-else
    :items="items"
    items-per-page="-1"
    density="compact"
    :headers="headers"
    :loading="playlistsStore.loading || uploadedVideosStore.loading"
    hide-default-footer
  >
    <!-- eslint-disable-next-line vue/valid-v-slot -->
    <template #item.status="{ item }">
      <VChip
        :color="statusColor(item.status)"
        density="compact"
      >
        {{ capitalizeFirstLetter(matchUploadStatusToUiString(item.status)) }}
      </VChip>
    </template>

    <template
      v-for="playlist in (playlistsStore.playlists ?? []).map(p => p.label)"
      #[`item.${playlist}`]="{ item }"
      :key="playlist"
    >
      <VIcon
        v-if="item.statusByLabel[playlist] && item.statusByLabel[playlist].success"
        icon="mdi-cloud-check-variant"
        color="success"
      />
      <VIcon
        v-else
        icon="mdi-cloud-outline"
        color="error"
      />
    </template>
  </VDataTable>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { capitalizeFirstLetter } from "@/util/capitalize";
import { useUploadedVideosStore } from "@/stores/uploadedVideos";
import { usePlaylistsStore } from "@/stores/playlists";
import { MatchUploadStatus, matchUploadStatusToUiString } from "@/types/EventUploadStatusByMatch";

const playlistsStore = usePlaylistsStore();

const uploadedVideosStore = useUploadedVideosStore();
refreshData();

async function refreshData() {
  await playlistsStore.getPlaylists();
  await uploadedVideosStore.getMatchUploadStatuses();
}

function statusColor(status: string) {
  if (status === MatchUploadStatus.NOT_STARTED) {
    return "error";
  }

  if (status === MatchUploadStatus.PARTIAL) {
    return "warning";
  }

  return "success";
}

const headers = computed(() => [
  { key: "matchName", title: "Match" },
  { key: "status", title: "Upload status" },
  {
    title: "By label",
    align: "center",
    children: (playlistsStore.playlists ?? []).map(playlist => ({
        key: playlist.label,
        title: capitalizeFirstLetter(playlist.label),
      }),
    ),
  },
]);

// Wrapping uploadedVideosStore.matchUploadStatuses in computed() is necessary to ensure that the table re-renders
// when the store's state changes.
const items = computed(() => uploadedVideosStore.matchUploadStatuses);

const progressBarColor = computed(() => {
  if (uploadedVideosStore.completedPercent === 1) {
    return "success";
  }

  return "primary";
});
</script>
