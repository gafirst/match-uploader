import {acceptHMRUpdate, defineStore} from "pinia";
import {ISettings, SettingType} from "@/types/ISettings";
import {ref} from "vue";
import {IYouTubeRedirectUriResponse} from "@/types/youtube/IYouTubeRedirectUriResponse";
import {IYouTubeAuthState} from "@/types/youtube/IYouTubeAuthState";
import {IObfuscatedSecrets} from "@/types/IObfuscatedSecrets";

export const useSettingsStore = defineStore("settings", () => {
    const settings = ref<ISettings | null>(null);
    // Whether secret values exist - not the actual secret values
    const obfuscatedSecrets = ref<IObfuscatedSecrets | null>(null);
    const descriptionTemplate = ref<string | null>(null);

    const youTubeAuthState = ref<IYouTubeAuthState | null>(null);
    const youTubeOAuth2RedirectUri = ref<string | null>(null);

    const isFirstLoad = ref(true);
    const loading = ref(false);
    const error = ref("");

    function handleApiError(result: Response, message: string) {
        if (!result.ok) {
            error.value = `API error (${result.status} ${result.statusText}): ${message}`;
            return true;
        }

        return false;
    }

    async function getSettings(showLoading: boolean = true) {
        loading.value = showLoading;
        const settingsResult = await fetch("/api/v1/settings");

        // Load settings separately from YouTube auth status and redirect URI
        if (handleApiError(settingsResult, "Unable to load settings")) {
            loading.value = false;
            isFirstLoad.value = false;
            return;
        } else {
            settings.value = await settingsResult.json();
        }

        const secretsResult = await fetch("/api/v1/settings/secrets");
        if (handleApiError(secretsResult, "Unable to load obfuscatedSecrets")) {
            loading.value = false;
            isFirstLoad.value = false;
            return;
        } else {
            obfuscatedSecrets.value = await secretsResult.json();
        }

        const descriptionResult = await fetch("/api/v1/settings/description");
        if (handleApiError(descriptionResult, "Unable to load description template")) {
            loading.value = false;
            isFirstLoad.value = false;
            return;
        } else {
          const result = await descriptionResult.json();
          if (result.descriptionTemplate) {
            descriptionTemplate.value = result.descriptionTemplate;
          } else {
            error.value = "No description template found in description template response";
            console.error("No description template found in description template response:", result);
          }
        }

        const [youtubeAuthStatusResult, youTubeOAuth2RedirectUriResult] = await Promise.all([
            fetch("/api/v1/youtube/auth/status"),
            fetch("/api/v1/youtube/auth/meta/redirectUri"),
        ]);

        if (handleApiError(youtubeAuthStatusResult, "Unable to load YouTube auth status")
            || handleApiError(
                youTubeOAuth2RedirectUriResult,
                "Unable to obtain YouTube OAuth2 redirect URI from server",
            )
        ) {
            loading.value = false;
            isFirstLoad.value = false;
            return;
        }

        youTubeAuthState.value = await youtubeAuthStatusResult.json();

        youTubeOAuth2RedirectUri.value = (
            (await youTubeOAuth2RedirectUriResult.json()) as IYouTubeRedirectUriResponse
        ).redirectUri;

        loading.value = false;
        isFirstLoad.value = false;
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
        descriptionTemplate,
        error,
        getSettings,
        isFirstLoad,
        loading,
        saveSetting,
        settings,
        obfuscatedSecrets,
        youTubeAuthState,
        youTubeOAuth2RedirectUri,
    };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
