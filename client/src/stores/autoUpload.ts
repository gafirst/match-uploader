import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";

export const useAutoUploadStore = defineStore("autoUpload", () => {
  const settingsStore = useSettingsStore();

  const enableLoading = ref(false);
  const enableError = ref<string | null>(null);
  const unmetPrereqs = ref<string[] | null>(null);

  const isEnabled = computed(() => settingsStore.settings?.autoUploadEnabled);

  async function enable(startingMatchKey: string | null) {
    if (!startingMatchKey) {
      console.error("Auto Upload enable called with null startingMatchKey; this is a bug");
      return;
    }

    enableLoading.value = true;

    const response = await fetch("/api/v1/autoUpload/enable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startingMatchKey,
      }),
    }).catch(error => {
      enableError.value = `Unable to enable Auto Upload: ${error}`;
      enableLoading.value = false;
      return null;
    })

    if (!response) {
      return;
    }

    if (!response.ok) {
      enableError.value = "Unable to enable Auto Upload";
      enableLoading.value = false;
      return;
    }

    const data = await response.json();

    if (!data.ok) {
      enableError.value = "Unable to enable Auto Upload";
      enableLoading.value = false;
    }

    if ("unmetPrereqs" in data && data.unmetPrereqs.length) {
      unmetPrereqs.value = data.unmetPrereqs;
    } else {
      unmetPrereqs.value = null;
    }

    await settingsStore.getSettings(false);
    enableLoading.value = false;
  }

  return {
    enable,
    enableError,
    enableLoading,
    isEnabled,
    unmetPrereqs,
  }
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAutoUploadStore, import.meta.hot));
}
