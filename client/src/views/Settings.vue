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
        <AutosavingTextInput :key="`eventName-${dataRefreshKey}`"
                             :on-submit="submit"
                             :initial-value="settingsStore.settings?.eventName"
                             name="eventName"
                             label="Event name"
                             input-type="text"
                             setting-type="setting"
                             class="mt-4"
        />
        <AutosavingTextInput :key="`eventTbaCode-${dataRefreshKey}`"
                             :on-submit="submit"
                             :initial-value="settingsStore.settings?.eventTbaCode"
                             name="eventTbaCode"
                             label="Event TBA code"
                             input-type="text"
                             setting-type="setting"
        />
        <AutosavingTextInput :key="`videoSearchDirectory-${dataRefreshKey}`"
                             :on-submit="submit"
                             :initial-value="settingsStore.settings?.videoSearchDirectory"
                             name="videoSearchDirectory"
                             label="Video search directory"
                             input-type="text"
                             setting-type="setting"
        />

        <p class="mb-1">Playoffs type</p>
        <VAlert v-if="settingsStore.settings?.playoffsType === PLAYOFF_BEST_OF_3"
                color="warning"
                variant="tonal"
                class="mb-2"
        >
          Best of 3 playoff support is limited and functionality may be broken or limited in this playoff mode.
        </VAlert>
        <AutosavingBtnSelectGroup :choices="PLAYOFF_MATCH_TYPES"
                                  :default-value="settingsStore.settings?.playoffsType"
                                  :loading="savingPlayoffMatchType"
                                  @on-choice-selected="savePlayoffMatchType"
        />

        <p class="mb-1">Sandbox mode</p>
        <AutosavingBtnSelectGroup :choices="['On', 'Off']"
                                  :default-value="settingsStore.settings?.sandboxModeEnabled ? 'On' : 'Off'"
                                  :loading="savingSandboxMode"
                                  @on-choice-selected="saveSandboxMode"
        />

        <h2 class="mt-4">The Blue Alliance (TBA)</h2>
        <AutosavingTextInput :key="`theBlueAllianceReadApiKey-${dataRefreshKey}`"
                             :on-submit="submit"
                             initial-value=""
                             name="theBlueAllianceReadApiKey"
                             label="TBA read API key"
                             input-type="password"
                             setting-type="secret"
                             :help-text="theBlueAllianceReadApiKeyHelpText"
        />

        <h2 class="mt-4">
          YouTube
        </h2>

        <h3 class="mb-2">OAuth2 client details</h3>
        <VAlert v-if="!settingsStore.youTubeAuthState?.accessTokenStored"
                class="mb-3"
        >
          In your Google Cloud project, create an OAuth2 web client.<br />
          <br />
          <div v-if="settingsStore.youTubeOAuth2RedirectUri">
            Make sure to add the following as an authorized redirect URI:
            <VTextField :value="settingsStore.youTubeOAuth2RedirectUri"
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
        <VAlert v-if="settingsStore.youTubeAuthState?.accessTokenStored"
                class="mb-3"
                color="info"
        >
          You already have an active YouTube connection. Please use the Reset YouTube Connection button below to
          adjust your YouTube OAuth2 client details.
        </VAlert>
        <AutosavingTextInput :on-submit="submit"
                             :initial-value="settingsStore.settings?.googleClientId"
                             name="googleClientId"
                             label="OAuth2 client ID"
                             :disabled="settingsStore.youTubeAuthState?.accessTokenStored"
                             input-type="text"
                             setting-type="setting"
                             @saved-value-updated="() => refreshData(false)"
        />

        <AutosavingTextInput :on-submit="submit"
                             initial-value=""
                             name="googleClientSecret"
                             label="OAuth2 client secret"
                             :help-text="settingsStore.youTubeAuthState?.clientSecretProvided ?
                               'Current value hidden' :
                               ''"
                             input-type="password"
                             setting-type="secret"
                             :disabled="settingsStore.youTubeAuthState?.accessTokenStored"
                             class="mb-3"
                             @saved-value-updated="() => refreshData(false)"
        />
        <YouTubeConnectionInfo :google-auth-status="settingsStore.settings?.googleAuthStatus"
                               :you-tube-auth-state="settingsStore.youTubeAuthState"
                               @trigger-refresh="refreshData"
        />
      </div>
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import AutosavingTextInput from "@/components/form/AutosavingTextInput.vue";
import {computed, onMounted, ref} from "vue";
import {SettingType} from "@/types/ISettings";
import YouTubeConnectionInfo from "@/components/youtube/YouTubeConnectionInfo.vue";
import {PLAYOFF_BEST_OF_3, PLAYOFF_MATCH_TYPES} from "@/types/MatchType";
import AutosavingBtnSelectGroup from "@/components/form/AutosavingBtnSelectGroup.vue";
import {useSettingsStore} from "@/stores/settings";

// const loading = ref(true);
const loading = computed(() => {
  return settingsStore.loading;
});

// const error = ref("");
const error = computed(() => {
  return settingsStore.error;
});
const settingsStore = useSettingsStore();
// const settings = ref<ISettings | null>(null);
// const youTubeAuthState = ref<IYouTubeAuthState | null>(null);
const dataRefreshKey = ref(1);
const youTubeOAuth2RedirectUriCopied = ref(false);
// const youTubeOAuth2RedirectUri = ref<string | null>(null);
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
  if (settingsStore.youTubeOAuth2RedirectUri) {
    navigator.clipboard.writeText(settingsStore.youTubeOAuth2RedirectUri); // https://stackoverflow.com/a/61503961
    youTubeOAuth2RedirectUriCopied.value = true;
  }
}

async function refreshData(showLoading: boolean = true) {
  await settingsStore.getSettings(showLoading);
  dataRefreshKey.value++;
}

onMounted(async () => {
  await refreshData();
});

async function submit(settingName: string, value: string | boolean, settingType: SettingType) {
  return await settingsStore.saveSetting(settingName, value, settingType);
}

async function savePlayoffMatchType(value: string): Promise<void> {
  savingPlayoffMatchType.value = true;
  await submit("playoffsType", value, "setting");
  await refreshData(false);
  savingPlayoffMatchType.value = false;
}

// TODO(Evan): Move into its own component
const savingSandboxMode = ref(false);

const handleBtnSelectGroupError = (e: Error) => {
  console.error(e);
  savingSandboxMode.value = false;
};

async function saveSandboxMode(value: string): Promise<void> {
  savingSandboxMode.value = true;
  await submit("sandboxModeEnabled", value === "On", "setting");
  await refreshData(false);
  savingSandboxMode.value = false;
}

const theBlueAllianceReadApiKeyHelpText = computed((): string => {
  const baseText = "Generate a read API key from your account page on The Blue Alliance.";

  if (settingsStore.obfuscatedSecrets?.theBlueAllianceReadApiKey) {
    return `Current value hidden. ${baseText}`;
  }

  return baseText;
});

</script>

<style scoped>
i {
  opacity: 1 !important;
}
</style>
