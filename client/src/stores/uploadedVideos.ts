import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { isEventUploadStatusByMatch, UploadStatusSummary, UploadTotalsSummary } from "@/types/EventUploadStatusByMatch";

export const useUploadedVideosStore = defineStore("uploadedVideos", () => {
  const loading = ref(false);
  const error = ref("");
  const matchUploadStatuses = ref<UploadStatusSummary[]>([]);
  const matchUploadStatusTotals = ref<UploadTotalsSummary | null>(null);
  const eventKey = ref<string | null>(null);

  async function getMatchUploadStatuses(): Promise<void> {
    loading.value = true;
    error.value = "";

    const result = await fetch("/api/v1/matches/uploaded")
      .catch((e: unknown) => {
        error.value = `Unable to load uploaded videos: ${e}`;
        loading.value = false;
        return null;
      });

    if (!result) {
      return;
    }

    if (!result.ok) {
      error.value = `API error (${result.status} ${result.statusText}): Unable to load uploaded videos`;
      loading.value = false;
      return;
    }

    const data = await result.json();

    if (!isEventUploadStatusByMatch(data)) {
      console.error("isEventUploadStatusByMatch returned false for input:", data);
      error.value = "Can't show uploaded videos because the server sent an unexpected response";
      loading.value = false;
      return;
    }

    matchUploadStatuses.value = data.matches;
    matchUploadStatusTotals.value = data.totals;
    eventKey.value = data.eventKey;

    loading.value = false;
  }

  const completedPercent = computed(() => {
    if (matchUploadStatusTotals.value && matchUploadStatusTotals.value.total > 0) {
      return matchUploadStatusTotals.value.completed / matchUploadStatusTotals.value.total;
    }
    return 0;
  });

  return {
    completedPercent,
    error,
    eventKey,
    getMatchUploadStatuses,
    loading,
    matchUploadStatuses,
    matchUploadStatusTotals,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUploadedVideosStore, import.meta.hot));
}
