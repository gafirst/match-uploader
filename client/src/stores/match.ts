import {acceptHMRUpdate, defineStore} from "pinia";
import {computed, handleError, ref} from "vue";
import {MatchVideoInfo} from "@/types/MatchVideoInfo";

// Eventually the server will send this data
const matchesByKey: {
  [matchKey: string]: { matchKey: string; title: string };
} = {
  "2023gacar_qm1": {
    title: "Qualification 1",
    matchKey: "2023gacar_qm1",
  },
  "2023gacar_qm2": {
    title: "Qualification 2",
    matchKey: "2023gacar_qm2",
  },
  "2023gacar_qm3": {
    title: "Qualification 3",
    matchKey: "2023gacar_qm3",
  },
  "2023gacar_qm4": {
    title: "Qualification 4",
    matchKey: "2023gacar_qm4",
  },
  "2023gacar_qm5": {
    title: "Qualification 10",
    matchKey: "2023gacar_qm10",
  },
};


export const useMatchStore = defineStore("match", () => {
  // Note: Variables intended to be exported to be used elsewhere must be returned from this function!
  const matches = ref(Object.values(matchesByKey));
  const selectedMatchKey = ref<string | null>(null);

  const uploadInProgress = ref(false);

  async function selectMatch(matchKey: string) {
    selectedMatchKey.value = matchKey;
    await getMatchVideos();
    await getSuggestedDescription();
  }

  const selectedMatch = computed(() => {
    if (!selectedMatchKey.value) {
      return null;
    }
    return matchesByKey[selectedMatchKey.value];
  });

  const matchVideos = ref<MatchVideoInfo[]>([]);
  const matchVideosLoading = ref(false);
  const matchVideoError = ref("");

  async function getMatchVideos() {
    if (!selectedMatchKey.value) {
      return;
    }

    matchVideosLoading.value = true;
    matchVideoError.value = "";

    const result = await fetch(`/api/v1/matches/${selectedMatchKey.value}/videos/recommend`);

    if (!result.ok) {
      const message = `Unable to retrieve video file suggestions for ${selectedMatchKey.value}`;
      matchVideoError.value = `API error (${result.status} ${result.statusText}): ${message}`;
      matchVideosLoading.value = false;
      return;
    }

    const data = await result.json();

    if (!Object.hasOwnProperty.call(data, "recommendedVideoFiles")) {
      const stringifiedData = JSON.stringify(data);
      matchVideoError.value =
        `Error: video file suggestions API response missing recommendedVideoFiles property: ${stringifiedData}`;
      matchVideosLoading.value = false;
      return;
    }


    matchVideos.value = data.recommendedVideoFiles as MatchVideoInfo[];
    matchVideosLoading.value = false;
  }

  const description = ref<string | null>(null);
  const descriptionLoading = ref(false);
  const descriptionFetchError = ref("");

  async function getSuggestedDescription() {
    if (!selectedMatchKey.value) {
      return;
    }

    descriptionLoading.value = true;
    descriptionFetchError.value = "";

    const result = await fetch(`/api/v1/matches/${selectedMatchKey.value}/description`);

    if (!result.ok) {
      const message = `Unable to retrieve description for ${selectedMatchKey.value}`;
      descriptionFetchError.value = `API error (${result.status} ${result.statusText}): ${message}`;
      descriptionLoading.value = false;
      return;
    }

    const data = await result.json();

    if (!Object.hasOwnProperty.call(data, "description")) {
      const stringifiedData = JSON.stringify(data);
      descriptionFetchError.value =
        `Error: description API response missing description property: ${stringifiedData}`;
      descriptionLoading.value = false;
      return;
    }

    descriptionLoading.value = false;
    description.value = data.description;
  }

  return {
    description,
    descriptionFetchError,
    descriptionLoading,
    getMatchVideos,
    getSuggestedDescription,
    matchVideoError,
    matchVideos,
    matchVideosLoading,
    matches,
    selectMatch,
    selectedMatch,
    selectedMatchKey,
    uploadInProgress,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMatchStore, import.meta.hot));
}
