import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { usePlaylistsStore } from "@/stores/playlists";
import { useIntervalFn } from "@vueuse/core";
import { LiveModeStatus } from "@/types/liveMode/LiveModeStatus";
import { useMatchStore } from "@/stores/match";
import { useSettingsStore } from "@/stores/settings";
import { PLAYOFF_DOUBLE_ELIM } from "@/types/MatchType";
import { LiveModeRequirements } from "@/types/liveMode/LiveModeRequirements";
import { useWorkerStore } from "@/stores/worker";

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
  const workerStore = useWorkerStore();

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
      replayDisabled: !matchStore.isReplay,
      workerConnected: workerStore.isConnected,
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

    if (playlistStore.error || !playlistStore.playlists) {
      setError("Cannot determine if all required videos are present due to an error loading playlist " +
        `data: ${playlistStore.error}`);
      return false;
    }

    const requiredLabels = playlistStore.playlists.map((playlist) => playlist.label.toLowerCase());
    const actualLabels = matchStore.matchVideos.map((video) => video.videoLabel?.toLowerCase() ?? "unlabeled");
    missingPlaylistLabels.value = requiredLabels.filter((label) => !actualLabels.includes(label));

    return !missingPlaylistLabels.value.length;
  }

  async function liveModeTick() {
    try {
      lastTick.value = new Date();

      if (state.value !== LiveModeStatus.WAITING) {
        console.log(`[${new Date().toISOString()}] Live mode tick: state is ${state.value}, stopping tick`);
        return;
      }

      if (!isAllowed.value) {
        setError("The Live Mode requirements are no longer met.");
        return;
      }

      let attempts = 0;
      const maxAttempts = 2;
      let shouldCheckAgain = true;

      while (attempts < maxAttempts && shouldCheckAgain) {
        attempts++;

        state.value = LiveModeStatus.FETCH_VIDEOS;
        if (matchStore.isReplay) {
          setError("The Replay flag is set in the upload form. You must disable it to proceed.");
          return;
        }

        if (matchStore.nextMatchError) {
          setError("Unable to retrieve the next match. Check the upload form for errors.");
          return;
        }

        await matchStore.getMatchVideos();

        if (matchStore.matchVideoError) {
          setError("The videos list failed to refresh. Check the upload form for errors.");
          return;
        }

        if (await areAllRequiredVideosPresent()) {
          setFastTicks(true);
          state.value = LiveModeStatus.QUEUE_UPLOADS;

          if (matchStore.allMatchVideosUploaded) {
            state.value = LiveModeStatus.ADVANCE_MATCH;
            await matchStore.advanceMatch();
          } else if (!matchStore.allowMatchUpload) {
            if (!matchStore.description) {
              if (!matchStore.descriptionLoading) {
                // Description is not loading and we don't have one, try refreshing
                console.log("Description is unavailable and not loading, trying to refresh")
                await matchStore.getSuggestedDescription();
                if (!matchStore.description) {
                  console.log("Description still unavailable after refresh, switching to slow mode")
                  setFastTicks(false);
                  shouldCheckAgain = false;
                }
              } else {
                // Description is loading, just tick again
                console.log("Description is unavailable but loading, will wait for next tick")
                shouldCheckAgain = false;
              }
            } else {
              // Something else is preventing match uploads, raise an error
              setError("Videos cannot be queued for upload right now. Check the upload form for errors.");
              console.error("Cannot trigger upload right now, check matchStore");
            }
          } else {
            await matchStore.uploadVideos();
            if (matchStore.allMatchVideosQueued) {
              state.value = LiveModeStatus.ADVANCE_MATCH;
              await matchStore.advanceMatch();
            } else {
              shouldCheckAgain = false;
              setError("Some videos were not queued for upload. Check the upload form for errors.");
            }
          }
        } else { // If videos aren't present (or an error occurred while checking), switch to slow mode
          setFastTicks(false);
          shouldCheckAgain = false;
        }
      }
      state.value = LiveModeStatus.WAITING;
    } catch (e) {
      console.error("Unhandled during live mode tick", e);
      setError(`Live Mode encountered an error that could not be handled elsewhere: ${e}. ` +
        "This is unintentional, so please file a bug report.");
      state.value = LiveModeStatus.ERROR;
    }
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
      fastResume();
    } else {
      fastPause();
      slowResume();
    }
  }

  async function activate() {
    if (!isAllowed.value) {
      console.error("activate: Cannot activate live mode because isAllowed is false");
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
    error.value = null;
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
