import {defineStore} from "pinia";
import {ref} from "vue";
import {IPlaylistMapping} from "@/types/IPlaylistMapping";

export const usePlaylistsStore = defineStore("playlists", () => {
    const playlists = ref<IPlaylistMapping[]|null>(null);
    const loading = ref(false);
    const error = ref<string|null>(null);

    function handleApiError(result: Response, message: string) {
        console.log(result.ok);
        if (!result.ok) {
            error.value = `API error (${result.status} ${result.statusText}): ${message}`;
            return true;
        }

        return false;
    }

    async function getPlaylists() {
        loading.value = true;
        const result = await fetch("/api/v1/youtube/playlists");

        if (handleApiError(result, "Unable to load playlist mappings")) {
            loading.value = false;
            return;
        }

        const resultJson = await result.json();

        playlists.value = Object.keys(resultJson.playlists).map((key) => {
            return {
                label: key,
                playlist_id: resultJson.playlists[key].id,
                name: resultJson.playlists[key].name,
            };
        });
        loading.value = false;
    }

    function savePlaylistMapping(videoLabel: string, playlistId: string) {
        console.log(`Saving playlist mapping for ${videoLabel} to ${playlistId}`);
        // return fetch(`/api/v1/youtube/playlists/${videoLabel}`, {
        //     method: "PUT",
        //     headers: {
        //         "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify({
        //         playlist_id: playlistId,
        //         name: playlistName,
        //     }),
        // });
    }

    return {
        error,
        getPlaylists,
        loading,
        playlists,
        savePlaylistMapping,
    };
});
