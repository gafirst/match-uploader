import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { isTbaEventsArray, TbaEvent } from "@/types/tbaEvent";
import { isSampleVideoTitlesApiResponse, SampleVideoTitlesData } from "@/types/SampleVideoTitlesApiResponse";
import { useSettingsStore } from "@/stores/settings";

export enum ChangeEventWizardSteps {
  CONFIRM_EVENT = 1,
  CONFIRM_NAME = 2,
  TITLE_VALIDATION = 3,
}

export const changeEventsWizardSteps = [
  ChangeEventWizardSteps.CONFIRM_EVENT,
  ChangeEventWizardSteps.CONFIRM_NAME,
  ChangeEventWizardSteps.TITLE_VALIDATION,
];

export const useChangeEventStore = defineStore("changeEvent", () => {
  const settingsStore = useSettingsStore();

  const eventsAutocompleteLoading = ref(false);
  const eventsAutocompleteError = ref("");
  const eventsAutocompleteItems = ref<TbaEvent[]>([]);

  const sampleVideoTitlesLoading = ref(false);
  const sampleVideoTitlesError = ref("");
  const sampleVideoTitles = ref<SampleVideoTitlesData | null>(null);

  const sampleVideoTitlesLengthNotOk = computed(() => {
    if (!sampleVideoTitles.value) {
      return [];
    }

    return sampleVideoTitles.value.matchTitlesCheck.titles.filter(title => !title.lengthOk);
  });

  const currentStep = ref(1);

  async function getEventsAutocomplete() {
    eventsAutocompleteLoading.value = true;
    eventsAutocompleteError.value = "";

    const result = await fetch("/api/v1/events/autocomplete")
      .catch((e: unknown) => {
        eventsAutocompleteError.value = `Unable to load events: ${e}`;
        eventsAutocompleteLoading.value = false;
        return null;
      });

    if (!result) {
      return;
    }

    if (!result.ok) {
      eventsAutocompleteError.value = `API error (${result.status} ${result.statusText}): Unable to load events`;
      eventsAutocompleteLoading.value = false;
      return;
    }

    const data = await result.json();

    if (!isTbaEventsArray(data.events.sortedEvents)) {
      console.error("Events autocomplete response has unexpected type:", data.events.sortedEvents);
      eventsAutocompleteError.value = "Unexpected response from server";
      eventsAutocompleteLoading.value = false;
      return;
    }

    eventsAutocompleteItems.value = data.events.sortedEvents;
    eventsAutocompleteLoading.value = false;
  }


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedEventRaw = ref<string | any | null>(null);
  const selectedEventComputed = computed(() => {
    if (typeof selectedEventRaw.value === "object" && selectedEventRaw.value !== null) {
      return selectedEventRaw.value.value;
    }

    return selectedEventRaw.value;
  });

  const searchKey = ref<string | null>(null);

  const newEventName = ref<string | null>(null);

  watch(selectedEventRaw, (newValue: string | { event: TbaEvent } | null) => {
    sampleVideoTitles.value = null;
    if (typeof newValue === "object") {
      newEventName.value = selectedEventRaw.value?.event.name;
    } else {
      newEventName.value = null;
    }
  });

  async function getSampleVideoTitles() {
    sampleVideoTitles.value = null;

    if (!newEventName.value) {
      return null;
    }

    sampleVideoTitlesLoading.value = true;
    sampleVideoTitlesError.value = "";

    const params = new URLSearchParams({
      eventName: newEventName.value,
    });

    const result = await fetch(`/api/v1/youtube/sampleVideoTitles?${params.toString()}`)
      .catch((e: unknown) => {
        sampleVideoTitlesError.value = `Unable to load sample video titles: ${e}`;
        sampleVideoTitlesLoading.value = false;
        return null;
      });

    if (!result) {
      return;
    }

    if (!result.ok) {
      sampleVideoTitlesError.value
        = `API error (${result.status} ${result.statusText}): Unable to load sample video titles`;
      sampleVideoTitlesLoading.value = false;
      return null;
    }

    const jsonResult = await result.json();

    if (jsonResult.ok && isSampleVideoTitlesApiResponse(jsonResult)) {
      sampleVideoTitlesLoading.value = false;
      sampleVideoTitles.value = jsonResult.data;
    } else {
      sampleVideoTitlesError.value = "Unexpected response from server";
      sampleVideoTitlesLoading.value = false;
      console.error("Sample video titles response has unexpected type:", jsonResult);
      return;
    }
  }

  async function previousStep() {
    currentStep.value = currentStep.value - 1;
  }

  async function advanceStep() {
    const nextStep = currentStep.value + 1;

    currentStep.value = nextStep;
    if (nextStep == ChangeEventWizardSteps.TITLE_VALIDATION) {
      await getSampleVideoTitles();
    }
  }

  const saveChangesLoading = ref(false);
  const saveChangesError = ref("");
  const saveChangesSuccess = ref(false);

  async function saveChanges(): Promise<boolean> {
    saveChangesLoading.value = true;
    saveChangesError.value = "";

    const eventKey = selectedEventComputed.value;
    const eventName = newEventName.value;

    if (!eventKey || !eventName) {
      console.error("Update event key wizard can't save changes: event key or name not set. Event key:",
        eventKey,
        "name:",
        eventName);
      saveChangesError.value = "Unable to save changes because event key or name is not set";
      return false;
    }

    // If these aren't done in series, it will cause a
    await settingsStore.saveSetting("eventTbaCode", eventKey, "setting");
    await settingsStore.saveSetting("eventName", eventName, "setting");

    saveChangesLoading.value = false;
    if (settingsStore.error) {
      saveChangesError.value = `Unable to save changes: ${settingsStore.error}`;
      return false;
    }

    await settingsStore.refreshData(false);
    saveChangesSuccess.value = true;
    return true;
  }

  function reset() {
    currentStep.value = 1;
    selectedEventRaw.value = null;
    searchKey.value = null;
    newEventName.value = null;
    sampleVideoTitles.value = null;
    sampleVideoTitlesError.value = "";
    sampleVideoTitlesLoading.value = false;
  }

  return {
    advanceStep,
    currentStep,
    eventsAutocompleteLoading,
    eventsAutocompleteError,
    eventsAutocompleteItems,
    getEventsAutocomplete,
    newEventName,
    reset,
    previousStep,
    searchKey,
    selectedEventRaw,
    selectedEventComputed,
    sampleVideoTitles,
    sampleVideoTitlesError,
    sampleVideoTitlesLengthNotOk,
    sampleVideoTitlesLoading,
    saveChanges,
    saveChangesError,
    saveChangesLoading,
    saveChangesSuccess,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChangeEventStore, import.meta.hot));
}
