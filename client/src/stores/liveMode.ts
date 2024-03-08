import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { usePlaylistsStore } from "@/stores/playlists";
import { useIntervalFn } from "@vueuse/core";
import { LiveModeState, LM_SETUP } from "@/types/liveMode/LiveModeState";

export const useLiveModeStore = defineStore("liveMode", () => {
  const allowLiveMode = computed(() => {
    return false;
  });
  const lastTick = ref<Date | null>(null);
  const state = ref<LiveModeState>(LM_SETUP);

  const playlistStore = usePlaylistsStore();

  function liveModeTick() {
    console.log("Live mode tick hi", new Date());
    lastTick.value = new Date();

    if (state.value === LM_SETUP) {
      console.log(new Date().toISOString(), "Live mode tick: setup | No action");
    }
  }

  const { pause, resume, isActive } = useIntervalFn(liveModeTick, 60 * 5 * 1000);

  function triggerImmediateTick() {
    liveModeTick();
  }

  return {
    allowLiveMode,
    isActive,
    lastTick,
    pause,
    resume,
    state,
    triggerImmediateTick,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLiveModeStore, import.meta.hot));
}
