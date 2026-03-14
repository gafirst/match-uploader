import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";

export const useAutoUploadStore = defineStore("autoUpload", () => {
  const settingsStore = useSettingsStore();

  const changeStateLoading = ref(false);
  const changeStateError = ref<string | null>(null);
  const unmetPrereqs = ref<string[] | null>(null);

  const isEnabled = computed(() => settingsStore.settings?.autoUploadEnabled);

  async function enable(startingMatchKey: string | null) {
    if (!startingMatchKey) {
      console.error("Auto Upload enable called with null startingMatchKey; this is a bug");
      return;
    }

    changeStateLoading.value = true;

    const response = await fetch("/api/v1/autoUpload/enable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startingMatchKey,
      }),
    }).catch(error => {
      changeStateError.value = `Unable to enable Auto Upload: ${error}`;
      changeStateLoading.value = false;
      return null;
    })

    if (!response) {
      return;
    }

    if (!response.ok) {
      changeStateError.value = "Unable to enable Auto Upload";
      changeStateLoading.value = false;
      return;
    }

    const data = await response.json();

    if (!data.ok) {
      changeStateError.value = "Unable to enable Auto Upload";
      changeStateLoading.value = false;
    }

    if ("unmetPrereqs" in data && data.unmetPrereqs.length) {
      unmetPrereqs.value = data.unmetPrereqs;
    } else {
      unmetPrereqs.value = null;
    }

    await settingsStore.getSettings(false);
    changeStateLoading.value = false;
  }

  async function disable() {
    changeStateLoading.value = true;
    const result = await settingsStore.saveSetting("autoUploadEnabled", false, "setting");

    if (typeof result === "string") {
      changeStateError.value = `Unable to disable Auto Upload: ${result}`;
    }

    changeStateLoading.value = false;
  }

  return {
    disable,
    enable,
    changeStateError,
    changeStateLoading,
    isEnabled,
    unmetPrereqs,
  }
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAutoUploadStore, import.meta.hot));
}
