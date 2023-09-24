import {acceptHMRUpdate, defineStore} from "pinia";
import {computed, ref} from "vue";
import {MatchVideoFileInfo} from "@/types/MatchVideoFileInfo";

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
        title: "Qualification 5",
        matchKey: "2023gacar_qm5",
    },
};


export const useMatchStore = defineStore("match", () => {
    // Note: Variables intended to be exported to be used elsewhere must be returned from this function!
    const matches = ref(Object.values(matchesByKey));
    const selectedMatchKey = ref<string | null>(null);

    async function selectMatch(matchKey: string) {
        selectedMatchKey.value = matchKey;
        await getVideoFileSuggestions();
    }

    const selectedMatch = computed(() => {
        if (!selectedMatchKey.value) {
            return null;
        }
        return matchesByKey[selectedMatchKey.value];
    });

    const videoFileSuggestions = ref<MatchVideoFileInfo[]>([]);
    const videoSuggestionsLoading = ref(false);
    const videoSuggestionsError = ref("");

    async function getVideoFileSuggestions() {
        if (!selectedMatchKey.value) {
            return;
        }

        videoSuggestionsLoading.value = true;
        videoSuggestionsError.value = "";

        const result = await fetch(`/api/v1/matches/${selectedMatchKey.value}/videos/recommend`);

        if (!result.ok) {
            const message = `Unable to retrieve video file suggestions for ${selectedMatchKey.value}`;
            videoSuggestionsError.value = `API error (${result.status} ${result.statusText}): ${message}`;
            videoSuggestionsLoading.value = false;
            return;
        }

        const data = await result.json();

        if (!Object.hasOwnProperty.call(data, "recommendedVideoFiles")) {
            const stringifiedData = JSON.stringify(data);
            videoSuggestionsError.value =
                `Error: video file suggestions API response missing recommendedVideoFiles property: ${stringifiedData}`;
            videoSuggestionsLoading.value = false;
            return;
        }

        console.log(data.recommendedVideoFiles);
        videoFileSuggestions.value = data.recommendedVideoFiles as MatchVideoFileInfo[];
        videoSuggestionsLoading.value = false;
    }

    const description = ref("");
    const youTubeChannelId = ref<string | null>(null);

    return {
        matches,
        selectedMatchKey,
        description,
        youTubeChannelId,
        selectMatch,
        selectedMatch,
        videoFileSuggestions,
        videoSuggestionsLoading,
        videoSuggestionsError,
        getVideoFileSuggestions,
    };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useMatchStore, import.meta.hot));
}
