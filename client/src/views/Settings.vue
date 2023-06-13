<template>
  <h1>Settings</h1>
  <VRow>
    <VCol md="6">
      <VProgressCircular v-if="loading" indeterminate />
      <VAlert v-else-if="!!error"
              color="error"
      >
        {{ error }}
      </VAlert>
      <div v-else>
        <h2>General</h2>
        <VForm class="mt-4" @submit.prevent>
          <AutosavingTextInput :key="`eventName-${dataRefreshKey}`"
                               :on-submit="submit"
                               :initial-value="settings?.eventName"
                               name="eventName"
                               label="Event name"
                               input-type="text"
                               setting-type="setting"
          />
          <AutosavingTextInput :key="`eventTbaCode-${dataRefreshKey}`"
                               :on-submit="submit"
                               :initial-value="settings?.eventTbaCode"
                               name="eventTbaCode"
                               label="Event TBA code"
                               input-type="text"
                               setting-type="setting"
          />
          <AutosavingTextInput :key="`videoSearchDirectory-${dataRefreshKey}`"
                               :on-submit="submit"
                               :initial-value="settings?.videoSearchDirectory"
                               name="videoSearchDirectory"
                               label="Video search directory"
                               input-type="text"
                               setting-type="setting"
          />

          <p class="mb-1">Playoffs type</p>
          <BtnSelect :choices="PLAYOFF_MATCH_TYPES"
                     :default-value="settings?.playoffsType"
                     :loading="savingPlayoffMatchType"
                     @on-choice-selected="savePlayoffMatchType"
          />
        </VForm>

        <h2>YouTube</h2>

        <h3 class="mb-2">OAuth2 client details</h3>
        <VAlert v-if="!youTubeAuthState?.accessTokenStored"
                class="mb-3"
        >
          In your Google Cloud project, create an OAuth2 web client.<br />
          <br />
          <div v-if="youTubeOAuth2RedirectUri">
            Make sure to add the following as an authorized redirect URI:
            <VTextField :value="youTubeOAuth2RedirectUri"
                        readonly
                        variant="underlined"
                        @focus="$event.target.select()"
            >
              <template v-slot:append>
                <VBtn :color="youTubeOAuth2RedirectCopyBtnColor"
                      @click="copyYouTubeOAuth2RedirectUri"
                >
                  {{ youTubeOAuth2RedirectCopyBtnText }}
                </VBtn>
              </template>
            </VTextField>
          </div>
        </VAlert>
        <VAlert v-if="youTubeAuthState?.accessTokenStored"
                class="mb-3"
                color="info"
        >
          You already have an active YouTube connection. Please use the Reset YouTube Connection button below to
          adjust your YouTube OAuth2 client details.
        </VAlert>
        <AutosavingTextInput :key="`googleClientId-${dataRefreshKey}`"
                             :on-submit="submit"
                             :initial-value="settings?.googleClientId"
                             name="googleClientId"
                             label="OAuth2 client ID"
                             :disabled="youTubeAuthState?.accessTokenStored"
                             input-type="text"
                             setting-type="setting"
                             @saved-value-updated="refreshData"
        />

        <AutosavingTextInput :key="`googleClientSecret-${dataRefreshKey}`"
                             :on-submit="submit"
                             initial-value=""
                             name="googleClientSecret"
                             label="OAuth2 client secret"
                             :help-text="youTubeAuthState?.clientSecretProvided ? 'Current value hidden' : ''"
                             input-type="password"
                             setting-type="secret"
                             :disabled="youTubeAuthState?.accessTokenStored"
                             class="mb-3"
                             @saved-value-updated="refreshData"
        />
        <YouTubeConnectionInfo :google-auth-status="settings?.googleAuthStatus"
                               :you-tube-auth-state="youTubeAuthState"
                               @trigger-refresh="refreshData"
        />
      </div>
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import AutosavingTextInput from "@/components/form/AutosavingTextInput.vue";
import {computed, onMounted, ref} from "vue";
import {ISettings, SettingType} from "@/types/ISettings";
import YouTubeConnectionInfo from "@/components/youtube/YouTubeConnectionInfo.vue";
import {IYouTubeAuthState} from "@/types/youtube/IYouTubeAuthState";
import {IYouTubeRedirectUriResponse} from "@/types/youtube/IYouTubeRedirectUriResponse";
import BtnSelect from "@/components/form/BtnSelect.vue";
import {PLAYOFF_BEST_OF_3, PLAYOFF_DOUBLE_ELIM, PLAYOFF_MATCH_TYPES, PlayoffMatchType} from "@/types/MatchType";

const loading = ref(true);
const error = ref("");
const settings = ref<ISettings | null>(null);
const youTubeAuthState = ref<IYouTubeAuthState | null>(null);
const dataRefreshKey = ref(1);
const youTubeOAuth2RedirectUriCopied = ref(false);
const youTubeOAuth2RedirectUri = ref<string | null>(null);
const savingPlayoffMatchType = ref(false);

const youTubeOAuth2RedirectCopyBtnText = computed((): string => {
  if (youTubeOAuth2RedirectUriCopied.value) {
    return "Copied";
  }

  return "Copy";
});

const youTubeOAuth2RedirectCopyBtnColor = computed((): string => {
  if (youTubeOAuth2RedirectUriCopied.value) {
    return "success";
  }

  return "primary";
});

function copyYouTubeOAuth2RedirectUri() {
  if (youTubeOAuth2RedirectUri.value) {
    navigator.clipboard.writeText(youTubeOAuth2RedirectUri.value); // https://stackoverflow.com/a/61503961
    youTubeOAuth2RedirectUriCopied.value = true;
  }
}

function handleApiError(result: Response, message: string) {
  console.log(result.ok);
  if (!result.ok) {
    error.value = `API error (${result.status} ${result.statusText}): ${message}`;
    return true;
  }

  return false;
}

async function refreshData() {
  const [settingsResult, youtubeAuthStatusResult, youTubeOAuth2RedirectUriResult] = await Promise.all([
    fetch("/api/v1/settings"),
    fetch("/api/v1/youtube/auth/status"),
    fetch("/api/v1/youtube/auth/meta/redirectUri"),
  ]);

  if (handleApiError(settingsResult, "Unable to load settings")
    || handleApiError(youtubeAuthStatusResult, "Unable to load YouTube auth status")
    || handleApiError(youTubeOAuth2RedirectUriResult, "Unable to obtain YouTube OAuth2 redirect URI from server")
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
  dataRefreshKey.value++;
}

onMounted(async () => {
  await refreshData();
});

async function submit(settingName: string, value: string, settingType: SettingType) {
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

  return submitResult.ok;
}

async function savePlayoffMatchType(value: string): Promise<void> {
  savingPlayoffMatchType.value = true;
  await submit("playoffsType", value, "setting");
  savingPlayoffMatchType.value = false;
}

</script>

<style scoped>
i {
  opacity: 1 !important;
}
</style>
