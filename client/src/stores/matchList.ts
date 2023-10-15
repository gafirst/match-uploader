import {acceptHMRUpdate, defineStore} from "pinia";
import {ref} from "vue";
import {SimpleMatch} from "@/types/SimpleMatch";

export const useMatchListStore = defineStore("matchList", () => {
    // Note: Variables intended to be exported to be used elsewhere must be returned from this function!
    const matches = ref<SimpleMatch[]>([]);
    const loading = ref(false);
    const error = ref("");

    function handleApiError(result: Response, message: string) {
        if (!result.ok) {
            error.value = `API error (${result.status} ${result.statusText}): ${message}`;
            return true;
        }

        return false;
    }

    async function getMatchList(forceRefresh = false): Promise<void> {
        if (matches.value.length > 0 && !forceRefresh) {
            console.log("cached");
            return;
        }

        loading.value = true;
        error.value = "";
        const result = await fetch("/api/v1/matches");

        if (handleApiError(result, "Unable to load match list")) {
            loading.value = false;
            return;
        }

        const resultJson = await result.json();

        if (!resultJson.matches) {
            error.value = "API error: matches not found in response";
            loading.value = false;
            return;
        }

        matches.value = resultJson.matches;
        loading.value = false;
    }

    return {
        error,
        loading,
        matches,
        getMatchList,
    };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useMatchListStore, import.meta.hot));
}
