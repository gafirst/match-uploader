import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { usePlaylistsStore } from "@/stores/playlists";
import { useIntervalFn } from "@vueuse/core";
import { LiveModeState } from "@/types/liveMode/LiveModeState";
import { useMatchStore } from "@/stores/match";

export const useLiveModeStore = defineStore("liveMode", () => {
  const lastTick = ref<Date | null>(null);
  const state = ref<LiveModeState>(LiveModeState.SETUP);

  const playlistStore = usePlaylistsStore();
  const matchStore = useMatchStore();

  const allowLiveMode = computed(() => {
    return matchStore.selectedMatchKey;
  });
  async function areAllVideosPresent() {
    await playlistStore.getPlaylists();

    if (!playlistStore.playlists) {
      return false; // FIXME: this should trigger an error
    }

    return playlistStore.playlists.every((playlist) => {
      const result = matchStore.matchVideos.some((video) => {
          console.log("video.videoLabel?.toLowerCase() ?? \"unlabeled\"", video.videoLabel?.toLowerCase() ?? "unlabeled");
          console.log("playlist.label.toLowerCase()", playlist.label.toLowerCase());
          return (video.videoLabel?.toLowerCase() ?? "unlabeled") === playlist.label.toLowerCase();
        },
      );

      console.log("result for playlist", playlist.label, result);

      return result;
    });
  }

  async function liveModeTick() {
    lastTick.value = new Date();

    console.log(new Date().toISOString(), "Live mode tick:", state.value);
    if (state.value === LiveModeState.WAITING) {
      state.value = LiveModeState.FETCH_VIDEOS;
      await matchStore.getMatchVideos();

      // fixme: all this nesting is gross
      if (await areAllVideosPresent()) {
        state.value = LiveModeState.QUEUE_UPLOADS;
        // await matchStore.queueMatchVideos();
        if (!matchStore.allowMatchUpload) {
          console.error("Cannot trigger upload right now, check matchStore"); // fixme
        } else {
          await matchStore.uploadVideos();
          // fixme: check if it succeeded?

          state.value = LiveModeState.ADVANCE_MATCH;
          await matchStore.advanceMatch();
          state.value = LiveModeState.WAITING;
        }
      } else {
        state.value = LiveModeState.WAITING;
      }
    }
  }

  const { pause, resume, isActive } = useIntervalFn(liveModeTick, 60 * 5 * 1000, {
    immediate: false,
  });

  async function activate() {
    if (!matchStore.selectedMatchKey) {
      return; // FIXME: throw error
    }

    resume();
    state.value = LiveModeState.WAITING;
    await triggerImmediateTick();
  }

  async function triggerImmediateTick() {
    await liveModeTick();
  }

  return {
    activate,
    allowLiveMode,
    isActive,
    lastTick,
    state,
    triggerImmediateTick,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLiveModeStore, import.meta.hot));
}
