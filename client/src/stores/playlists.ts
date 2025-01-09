import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { IPlaylistMapping } from "@/types/IPlaylistMapping";

export const usePlaylistsStore = defineStore("playlists", () => {
  const playlists = ref<IPlaylistMapping[] | null>(null);
  const loading = ref(false);
  const isFirstLoad = ref(true);
  const error = ref<string>("");
  const playlistMappingsExist = computed(() => !isFirstLoad.value && (playlists.value?.length ?? 0) > 0);

  const playlistMappings = computed(() => {
    if (!playlists.value) {
      return {};
    }

    return playlists.value.reduce((obj: Record<string, IPlaylistMapping>, playlist) => {
      obj[playlist.label] = playlist;
      return obj;
    }, {});
  });

  function handleApiError(result: Response, message: string) {
    if (!result.ok) {
      error.value = `API error (${result.status} ${result.statusText}): ${message}`;
      return true;
    }

    return false;
  }

  async function getPlaylists() {
    loading.value = true;
    error.value = "";
    const result = await fetch("/api/v1/youtube/playlists")
      .catch((e: unknown) => {
        error.value = `Unable to load playlist mappings: ${e}`;
        loading.value = false;
        return null;
      });

    if (!result) {
      loading.value = false;
      isFirstLoad.value = false;
      return;
    }

    if (handleApiError(result, "Unable to load playlist mappings")) {
      loading.value = false;
      isFirstLoad.value = false;
      return;
    }

    const resultJson = await result.json();

    playlists.value = Object.keys(resultJson.playlists).map((key) => {
      return {
        label: key,
        playlist_id: resultJson.playlists[key].id,
        name: resultJson.playlists[key].name,
      };
    });
    loading.value = false;
    isFirstLoad.value = false;
  }

  // TODO: Remove any types from this file

  /**
   * Save a playlist mapping
   *
   * @param videoLabel
   * @param playlistId
   * @return true if the playlist mapping was saved successfully, false otherwise
   */
  async function savePlaylistMapping(videoLabel: string, playlistId: string): Promise<boolean> {
    loading.value = true;
    error.value = "";
    const result = await fetch(`/api/v1/youtube/playlistMapping/${videoLabel}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playlistId,
      }),
    });

    loading.value = false;
    let apiError = handleApiError(result, "Unable to save playlist mapping");

    const resultJson = await result.json();

    if (resultJson.errors) {
      apiError = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error.value = resultJson.errors.map((error: any) => error.msg).join(", ");
    }

    return !apiError;
  }

  /**
   * Delete a playlist mapping
   *
   * @param videoLabel
   * @return true if the playlist mapping was saved successfully, false otherwise
   */
  async function deletePlaylistMapping(videoLabel: string): Promise<boolean> {
    loading.value = true;
    error.value = "";

    const result = await fetch(`/api/v1/youtube/playlistMapping/${videoLabel}`, {
      method: "DELETE",
    });

    loading.value = false;
    let apiError = handleApiError(result, "Unable to delete playlist mapping");

    const resultJson = await result.json();

    if (resultJson.errors) {
      apiError = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error.value = resultJson.errors.map((error: any) => error.msg).join(", ");
    }

    return !apiError;
  }

  return {
    deletePlaylistMapping,
    error,
    getPlaylists,
    isFirstLoad,
    loading,
    playlists,
    playlistMappings,
    playlistMappingsExist,
    savePlaylistMapping,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePlaylistsStore, import.meta.hot));
}
