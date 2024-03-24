import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { usePlaylistsStore } from "@/stores/playlists";
import { useIntervalFn } from "@vueuse/core";
import { LiveModeStatus } from "@/types/liveMode/LiveModeStatus";
import { useMatchStore } from "@/stores/match";
import { useSettingsStore } from "@/stores/settings";
import { PLAYOFF_DOUBLE_ELIM } from "@/types/MatchType";
import { LiveModeRequirements, LiveModeUnsatisfiedRequirements } from "@/types/liveMode/LiveModeRequirements";

export const useLiveModeStore = defineStore("liveMode", () => {
  const lastTick = ref<Date | null>(null);
  const state = ref<LiveModeStatus>(LiveModeStatus.STOPPED);

  const settingsStore = useSettingsStore();
  const playlistStore = usePlaylistsStore();
  const matchStore = useMatchStore();

  const requirements = computed<LiveModeRequirements>(() => {
    return {
      startingMatchKeyKnown: !!matchStore.selectedMatchKey,
      settingsLoaded: !settingsStore.isFirstLoad,
      doubleElimPlayoffs: settingsStore.settings?.playoffsType === PLAYOFF_DOUBLE_ELIM,
    };
  });

  const isAllowed = computed(() => {
    return Object.values(requirements.value).every(requirementMet => requirementMet);
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
    if (state.value === LiveModeStatus.WAITING) {
      state.value = LiveModeStatus.FETCH_VIDEOS;
      await matchStore.getMatchVideos();

      // fixme: all this nesting is gross
      if (await areAllVideosPresent()) {
        state.value = LiveModeStatus.QUEUE_UPLOADS;
        // await matchStore.queueMatchVideos();
        if (!matchStore.allowMatchUpload) {
          console.error("Cannot trigger upload right now, check matchStore"); // fixme
        } else {
          await matchStore.uploadVideos();
          // fixme: check if it succeeded?

          state.value = LiveModeStatus.ADVANCE_MATCH;
          await matchStore.advanceMatch();
          state.value = LiveModeStatus.WAITING;
        }
      } else {
        state.value = LiveModeStatus.WAITING;
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
    state.value = LiveModeStatus.WAITING;
    await triggerImmediateTick();
  }

  function deactivate() {
    pause();
    state.value = LiveModeStatus.STOPPED;
  }

  async function triggerImmediateTick() {
    await liveModeTick();
  }

  return {
    activate,
    deactivate,
    isActive,
    isAllowed,
    lastTick,
    requirements,
    state,
    triggerImmediateTick,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLiveModeStore, import.meta.hot));
}
