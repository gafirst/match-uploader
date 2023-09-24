import {acceptHMRUpdate, defineStore} from "pinia";
import {ISettings, SettingType} from "@/types/ISettings";
import {ref} from "vue";
import {IYouTubeRedirectUriResponse} from "@/types/youtube/IYouTubeRedirectUriResponse";
import {IYouTubeAuthState} from "@/types/youtube/IYouTubeAuthState";

export const useSettingsStore = defineStore("settings", () => {
    const settings = ref<ISettings | null>(null);
    const youTubeAuthState = ref<IYouTubeAuthState | null>(null);
    const youTubeOAuth2RedirectUri = ref<string | null>(null);

    const loading = ref(false);
    const error = ref("");

    function handleApiError(result: Response, message: string) {
        console.log(result.ok);
        if (!result.ok) {
            error.value = `API error (${result.status} ${result.statusText}): ${message}`;
            return true;
        }

        return false;
    }

    async function getSettings(showLoading: boolean = true) {
        loading.value = showLoading;
        const [settingsResult, youtubeAuthStatusResult, youTubeOAuth2RedirectUriResult] = await Promise.all([
            fetch("/api/v1/settings"),
            fetch("/api/v1/youtube/auth/status"),
            fetch("/api/v1/youtube/auth/meta/redirectUri"),
        ]);

        if (handleApiError(settingsResult, "Unable to load settings")
            || handleApiError(youtubeAuthStatusResult, "Unable to load YouTube auth status")
            || handleApiError(
                youTubeOAuth2RedirectUriResult,
                "Unable to obtain YouTube OAuth2 redirect URI from server",
            )
        ) {
            loading.value = false;
            return;
        }

        [settings.value, youTubeAuthState.value] = await Promise.all([
            settingsResult.json(),
            youtubeAuthStatusResult.json(),
        ]);

        youTubeOAuth2RedirectUri.value = (
            (await youTubeOAuth2RedirectUriResult.json()) as IYouTubeRedirectUriResponse
        ).redirectUri;

        loading.value = false;
    }

    async function saveSetting(settingName: keyof ISettings, value: string | boolean, settingType: SettingType) {
        if (!settings.value) {
            await getSettings();
        }

        const submitResult = await fetch(`/api/v1/settings/${settingName}`, {
            method: "POST",
            body: JSON.stringify({
                value,
                settingType,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!submitResult.ok) {
            return `Save error: ${submitResult.status} ${submitResult.statusText}`;
        }

        if (settings.value) {
            settings.value[settingName] = value;
        } else {
            console.warn("saveSetting: settings.value was null while trying to update stored settings in Pinia. "
                + `Setting name: ${settingName}`);
        }
        return submitResult.ok;
    }

    return {
        error,
        getSettings,
        loading,
        saveSetting,
        settings,
        youTubeAuthState,
        youTubeOAuth2RedirectUri,
    };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
