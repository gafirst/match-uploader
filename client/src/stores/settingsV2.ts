import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";

export const useSettingsStoreV2 = defineStore("settingsTest", () => {
  const error = ref("");
  const settings = ref<{
    [name: string]: {
      actualValue: string | null;
      proposedValue: string | null;
      error?: string;
      isSecret?: boolean;
    }
  }>({
    tbaEventCode: {
      actualValue: "2024gadal",
      proposedValue: "2024gadal",
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
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStoreV2, import.meta.hot));
}
