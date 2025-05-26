import {acceptHMRUpdate, defineStore} from "pinia";
import { ISettings, ISettingsClient, SaveSettingResult, SettingType } from "@/types/ISettings";
import { computed, ref } from "vue";
import {IYouTubeRedirectUriResponse} from "@/types/youtube/IYouTubeRedirectUriResponse";
import {IYouTubeAuthState} from "@/types/youtube/IYouTubeAuthState";
import {IObfuscatedSecrets} from "@/types/IObfuscatedSecrets";

export const useSettingsStore = defineStore("settings", () => {
    const rawSettings = ref<ISettingsClient | null>(null);

    const settings = computed(() => {
      if (rawSettings.value) {
        return Object.entries(rawSettings.value).reduce((acc, [key, value]) => {
          acc[key] = value.currentValue;
          return acc;
        }, {} as ISettings);
      } else {
        return null;
      }
    });

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
        const settingsResult = await fetch("/api/v1/settings/values");

        if (handleApiError(settingsResult, "Unable to load settings")) {
            loading.value = false;
            isFirstLoad.value = false;
            return;
        } else {
            const settingsJson = await settingsResult.json();
            rawSettings.value = Object.entries(settingsJson).reduce((acc, [key, value]) => {
                acc[key] = {
                    currentValue: value,
                    proposedValue: value,
                };
                return acc;
            }, {} as ISettingsClient);
        }

        const secretsResult = await fetch("/api/v1/settings/secrets");
        if (handleApiError(secretsResult, "Unable to load obfuscatedSecrets")) {
            loading.value = false;
            isFirstLoad.value = false;
            return;
        } else {
            obfuscatedSecrets.value = await secretsResult.json();
        }

        const descriptionResult = await fetch("/api/v1/settings/descriptionTemplate");
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

    async function saveSetting(settingName: keyof ISettings, value: string | boolean | undefined, settingType: SettingType): Promise<SaveSettingResult> {
      let error: string | undefined = undefined;

      const submitResult = await fetch(`/api/v1/settings/values/${settingName}`, {
            method: "POST",
            body: JSON.stringify({
                value,
                settingType,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        }).catch((e: unknown) => {
            error = `Error saving setting: ${e}`;
        });

        if (!submitResult) {
          return {
            success: false,
            error,
          }
        }

        if (!submitResult.ok) {
            return {
              success: false,
              error: `Error saving setting: ${submitResult.status} ${submitResult.statusText}`,
            }
        }

        if (rawSettings.value) {
          rawSettings.value[settingName].currentValue = value;
        } else {
          console.error("rawSettings.value is null");
          return {
            success: false,
            error: "Cannot save setting before settings have been loaded",
          }
        }

        return {
          success: submitResult.ok,
          error,
        };
    }

    async function saveDescriptionTemplate(value: string) {
      const submitResult = await fetch("/api/v1/settings/descriptionTemplate", {
        method: "POST",
        body: JSON.stringify({
          descriptionTemplate: value,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!submitResult.ok) {
        return `Error saving description template: ${submitResult.status} ${submitResult.statusText}`;
      }

      descriptionTemplate.value = value;
      return submitResult.ok;
    }

    return {
        descriptionTemplate,
        error,
        getSettings,
        isFirstLoad,
        loading,
        rawSettings,
        saveDescriptionTemplate,
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
