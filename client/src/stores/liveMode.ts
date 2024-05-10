import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { usePlaylistsStore } from "@/stores/playlists";
import { useIntervalFn } from "@vueuse/core";
import { LiveModeStatus } from "@/types/liveMode/LiveModeStatus";
import { useMatchStore } from "@/stores/match";
import { useSettingsStore } from "@/stores/settings";
import { PLAYOFF_DOUBLE_ELIM } from "@/types/MatchType";
import { LiveModeRequirements, LiveModeUnsatisfiedRequirements } from "@/types/liveMode/LiveModeRequirements";
import LiveMode from "@/components/liveMode/LiveMode.vue";

export const useLiveModeStore = defineStore("liveMode", () => {
  const lastTick = ref<Date | null>(null);

  const slowTickIntervalMilliseconds = 60 * 5 * 1000; // 5 minutes in milliseconds
  const fastTickIntervalMilliseconds = 10 * 1000; // 10 seconds in milliseconds

  const tickIntervalMilliseconds = computed(() => {
    if (isFastActive.value) {
      return fastTickIntervalMilliseconds;
    }

    if (isSlowActive.value) {
      return slowTickIntervalMilliseconds;
    }

    return null;
  });

  const state = ref<LiveModeStatus>(LiveModeStatus.STOPPED);
  const error = ref<string | null>(null);

  const settingsStore = useSettingsStore();
  const playlistStore = usePlaylistsStore();
  const matchStore = useMatchStore();

  const lastAction = ref<LiveModeStatus | null>(null);
  const missingPlaylistLabels = ref<string[]>([]);

  const estimatedNextTick = computed(() => {
    if (!lastTick.value || !tickIntervalMilliseconds.value) {
      return null;
    }

    return new Date(lastTick.value.getTime() + tickIntervalMilliseconds.value);
  });

  const requirements = computed<LiveModeRequirements>(() => {
    return {
      startingMatchKeyKnown: !!matchStore.selectedMatchKey,
      settingsLoaded: !settingsStore.isFirstLoad,
      doubleElimPlayoffs: settingsStore.settings?.playoffsType === PLAYOFF_DOUBLE_ELIM,
    };
  });

  function setError(errorString: string) {
    state.value = LiveModeStatus.ERROR;
    error.value = errorString;
    setFastTicks(false);
  }

  const isAllowed = computed(() => {
    return Object.values(requirements.value).every(requirementMet => requirementMet);
  });

  async function areAllRequiredVideosPresent() {
    missingPlaylistLabels.value = [];
    await playlistStore.getPlaylists();

    console.log("playlistStore.playlists", playlistStore.playlists);

    if (playlistStore.error || !playlistStore.playlists) {
      setError("Cannot determine if all required videos are present due to an error loading playlist " +
        `data: ${playlistStore.error}`);
      return false;
    }

    // FIXME: does not return all missing labels because of `every`
    return playlistStore.playlists.every((playlist) => {
      const result = matchStore.matchVideos.some((video) => {
          console.log("video.videoLabel?.toLowerCase() ?? \"unlabeled\"", video.videoLabel?.toLowerCase() ?? "unlabeled");
          console.log("playlist.label.toLowerCase()", playlist.label.toLowerCase());
          return (video.videoLabel?.toLowerCase() ?? "unlabeled") === playlist.label.toLowerCase();
        },
      );

      console.log("result for playlist", playlist.label, result);

      if (!result) {
        missingPlaylistLabels.value.push(playlist.label);
      }

      return result;
    });
  }

  async function liveModeTick() {
    lastTick.value = new Date();

    console.log(new Date().toISOString(), "Live mode tick:", state.value);
    if (state.value !== LiveModeStatus.WAITING) {
      console.log(`Live mode tick: state is ${state.value}, stopping tick`);
      return;
    }

    let attempts = 0;
    const maxAttempts = 2;
    let shouldCheckAgain = true;

    // FIXME: what happens if the description isn't available?
    while (attempts < maxAttempts && shouldCheckAgain) {
      attempts++;

      state.value = LiveModeStatus.FETCH_VIDEOS;
      await matchStore.getMatchVideos();

      if (await areAllRequiredVideosPresent()) {
        setFastTicks(true);
        state.value = LiveModeStatus.QUEUE_UPLOADS;

        if (matchStore.allMatchVideosUploaded) {
          state.value = LiveModeStatus.ADVANCE_MATCH;
          await matchStore.advanceMatch();
        } else if (!matchStore.allowMatchUpload) {
          shouldCheckAgain = false;
          setError("Videos cannot be queued for upload right now. Check the upload form for errors.");
          console.error("Cannot trigger upload right now, check matchStore");
        } else {
          await matchStore.uploadVideos(); // FIXME: check if all upload job creations succeeded?
          if (matchStore.allMatchVideosQueued) {
            state.value = LiveModeStatus.ADVANCE_MATCH;
            await matchStore.advanceMatch();
          } else {
            shouldCheckAgain = false;
            setError("All videos were not queued for upload; please check for errors in the upload form");
          }
        }
      } else {
        if (error.value) {
          state.value = LiveModeStatus.ERROR;
        }
        // If videos aren't present, drop back to slow mode
        setFastTicks(false);
        shouldCheckAgain = false;
      }
    }

    state.value = LiveModeStatus.WAITING;
  }

  const {
    pause: slowPause,
    resume: slowResume,
    isActive: isSlowActive,
  } = useIntervalFn(liveModeTick, slowTickIntervalMilliseconds, { immediate: false });

  const {
    pause: fastPause,
    resume: fastResume,
    isActive: isFastActive,
  } = useIntervalFn(liveModeTick, fastTickIntervalMilliseconds, { immediate: false });

  function setFastTicks(enableFastTicks: boolean) {
    console.log(`setFastTicks: ${enableFastTicks}`);
    if (enableFastTicks) {
      slowPause();
      fastResume(); // FIXME: is it problematic to call this twice?
    } else {
      fastPause();
      slowResume();
    }
  }

  async function activate() {
    if (!matchStore.selectedMatchKey) { // FIXME: replace with requirements check
      console.error("Cannot activate live mode because a match is not selected");
      state.value = LiveModeStatus.ERROR;
      return;
    }

    state.value = LiveModeStatus.WAITING;
    error.value = null;
    fastResume();
    await triggerImmediateTick();
  }

  function deactivate() {
    fastPause();
    slowPause();
    state.value = LiveModeStatus.STOPPED;
  }

  async function triggerImmediateTick() {
    await liveModeTick();
  }

  async function clearErrorAndTick() {
    error.value = null;
    state.value = LiveModeStatus.WAITING;
    await triggerImmediateTick();
  }

  const isActive = computed(() => {
    return isSlowActive.value || isFastActive.value;
  });

  return {
    activate,
    clearErrorAndTick,
    deactivate,
    error,
    estimatedNextTick,
    isActive,
    isFastActive,
    isSlowActive,
    isAllowed,
    lastTick,
    missingPlaylistLabels,
    requirements,
    state,
    triggerImmediateTick,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLiveModeStore, import.meta.hot));
}
