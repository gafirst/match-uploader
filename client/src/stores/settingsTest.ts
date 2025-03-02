import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";

export const useTestSettingsStore = defineStore("settingsTest", () => {
  const error = ref("");
  const settings = ref<{
    [name: string]: {
      actualValue: string;
      proposedValue: string;
      error: string;
    }
  }>({
    tbaEventCode: {
      actualValue: "2024gadal",
      proposedValue: "2024gadal",
      error: "",
    }
  })

  async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function saveSetting(name: "tbaEventCode") {
    await sleep(3000);
    const success = Math.random() < .7;

    if (success) {
      settings.value[name].actualValue = settings.value[name].proposedValue;
    } else {
      settings.value[name].error = "Unable to save"
    }
  }
  return {
    settings,
    saveSetting,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTestSettingsStore, import.meta.hot));
}
