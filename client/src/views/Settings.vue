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

        <p class="mb-1">Video upload privacy</p>
        <AutosavingBtnSelectGroup :choices="['Public', 'Unlisted', 'Private']"
                                  :default-value="capitalize(settingsStore.settings?.youTubeVideoPrivacy ?? 'public')"
                                  :loading="savingUploadPrivacy"
                                  @on-choice-selected="saveUploadPrivacy"
        />

        <h2 class="mb-1">Video description template</h2>
        <VExpansionPanels class="mb-4">
          <VExpansionPanel>
            <VExpansionPanelTitle>Description template syntax/variables</VExpansionPanelTitle>
            <VExpansionPanelText>
              <ul class="ml-4">
                <li>
                  This description template will be rendered using
                  <a href="https://mustache.github.io/mustache.5.html">Mustache</a>.
                </li>
                <li>Enclose variables (except URLs) inside <code v-pre>{{ two curly braces }}</code></li>
                <li>
                  If a variable is noted as <code>(contains URL)</code>, it should be enclosed inside
                  <code v-pre>{{{ three curly braces }}}</code> so that Mustache won't escape them.
                </li>
                <li>
                  <code v-pre>{{! comment }}</code> - Two curly braces followed by an exclamation point denotes a
                  comment that will not be rendered in the final description.
                </li>
              </ul>
              <br />
              <p>Available variables:</p>
              <ul class="ml-4">
                <li>
                  <code>eventName</code> - Value of the event name setting (current value:
                  <code>{{ settingsStore.settings?.eventName ?? "Loading..." }}</code>)
                </li>
                <li>
                  <code>capitalizedVerboseMatchName</code> - the full form of the match name, such as
                  <code>Qualification Match 1</code> or <code>Playoff Match 3 (R1)</code>
                </li>
                <li>
                  <code>redTeams</code> - red alliance team numbers separated by a comma and a space (example:
                  <code>1234, 1234, 1234</code>)
                </li>
                <li>
                  <code>blueTeams</code> - blue alliance team numbers separated by a comma and a space (example:
                  <code>1234, 1234, 1234</code>)
                </li>
                <li><code>redScore</code> - red alliance match score (if available) (example: <code>21</code>)</li>
                <li><code>blueScore</code> - blue alliance match score (if available) (example: <code>21</code>)</li>
                <li>
                  <code>matchDetailsSite</code> - either "The Blue Alliance" or "FRC Events" depending on the currently
                  selected match data source
                </li>
                <li>
                  <code>matchUrl</code> <strong>(contains URL)</strong> - URL where full match results can be viewed
                  (links to The Blue Alliance or FRC Events depending on the currently selected match data source)
                  (example: <code>https://www.thebluealliance.com/match/2023gaalb_sf1m1</code> or
                  <code>https://frc-events.firstinspires.org/2023/gaalb/playoffs/3</code>)
                </li>
                <li>
                  <code>matchUploaderAttribution</code> <strong>(contains URL)</strong> - the text <code>Uploaded using
                    https://github.com/gafirst/match-uploader</code>
                </li>
              </ul>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
        <!--        FIXME: Add save function -->
        <AutosavingTextInput :key="`descriptionTemplate-${dataRefreshKey}`"
                             :on-submit="submit"
                             :initial-value="settingsStore.descriptionTemplate ?? undefined"
                             name="descriptionTemplate"
                             label="Template for YouTube video descriptions"
                             input-type="textarea"
                             setting-type="descriptionTemplate"
                             help-text=""
        />

        <h2 class="mt-4">The Blue Alliance (TBA)</h2>
        <h3>Read API</h3>
        <AutosavingTextInput :key="`theBlueAllianceReadApiKey-${dataRefreshKey}`"
                             :on-submit="submit"
                             initial-value=""
                             name="theBlueAllianceReadApiKey"
                             label="TBA read API key"
                             input-type="password"
                             setting-type="secret"
                             :help-text="tbaReadApiKeyHelpText"
        />

        <h3 class="mt-2">Trusted (write) API</h3>
        <p>
          You can use TBA's trusted API to associate uploaded videos with matches on TBA. To use this feature,
          you must request write tokens for your event on
          <a href="https://www.thebluealliance.com/request/apiwrite/">
            https://www.thebluealliance.com/request/apiwrite/
          </a>
        </p>

        <p class="mt-4">Link match videos on TBA</p>
        <AutosavingBtnSelectGroup :choices="['On', 'Off']"
                                  :default-value="settingsStore.settings?.linkVideosOnTheBlueAlliance ? 'On' : 'Off'"
                                  :loading="savingTbaLinkVideos"
                                  @on-choice-selected="saveTbaLinkVideos"
        />

        <VAlert v-if="!settingsStore.settings?.linkVideosOnTheBlueAlliance"
                color="info"
                variant="tonal"
                class="mt-4 mb-4"
        >
          Some settings are hidden because linking match videos on TBA is disabled. Enable the feature to see them.
        </VAlert>

        <AutosavingTextInput v-if="
                               settingsStore.settings?.linkVideosOnTheBlueAlliance"
                             :key="`theBlueAllianceTrustedApiAuthId-${dataRefreshKey}`"
                             :on-submit="submit"
                             initial-value=""
                             name="theBlueAllianceTrustedApiAuthId"
                             label="TBA trusted API auth ID"
                             input-type="password"
                             setting-type="secret"
                             :help-text="settingsStore.obfuscatedSecrets?.theBlueAllianceTrustedApiAuthId ?
                               'Current value hidden' :
                               ''"
        />

        <AutosavingTextInput v-if="settingsStore.settings?.linkVideosOnTheBlueAlliance"
                             :key="`theBlueAllianceTrustedApiAuthSecret-${dataRefreshKey}`"
                             :on-submit="submit"
                             initial-value=""
                             name="theBlueAllianceTrustedApiAuthSecret"
                             label="TBA trusted API auth secret"
                             input-type="password"
                             setting-type="secret"
                             :help-text="settingsStore.obfuscatedSecrets?.theBlueAllianceTrustedApiAuthId ?
                               'Current value hidden' :
                               ''"
        />

        <h2 class="mt-4">
          FRC Events API
        </h2>
        <p class="mt-4">
          If match data is unavailable on The Blue Alliance, it may be available on the FRC Events API. You can check
          if data is available on
          <a href="https://frc-events.firstinspires.org/">https://frc-events.firstinspires.org/</a> and request API
          credentials at
          <a href="https://frc-events.firstinspires.org/services/API">
            https://frc-events.firstinspires.org/services/API
          </a>.
        </p>
        <p class="mt-4 mb-2">
          To compute the API key, base64 encode the text <code>username:AuthorizationKey</code> and then
          paste it below.
        </p>

        <p class="mt-4">Retrieve match data from FRC Events</p>
        <AutosavingBtnSelectGroup :choices="['On', 'Off']"
                                  :default-value="settingsStore.settings?.useFrcEventsApi ? 'On' : 'Off'"
                                  :loading="savingFrcEventsApiKey"
                                  @on-choice-selected="saveFrcEventsApiKey"
        />

        <VAlert v-if="!settingsStore.settings?.useFrcEventsApi"
                color="info"
                variant="tonal"
                class="mt-4 mb-4"
        >
          Some settings are hidden because FRC Events integration is disabled. Enable the feature to see them.
        </VAlert>
        <AutosavingTextInput v-else
                             :key="`frcEventsApiKey-${dataRefreshKey}`"
                             :on-submit="submit"
                             initial-value=""
                             name="frcEventsApiKey"
                             label="Base64-encoded FRC Events API key"
                             input-type="password"
                             setting-type="secret"
                             :help-text="settingsStore.obfuscatedSecrets?.frcEventsApiKey ?
                               'Current value hidden' :
                               ''"
        />

        <h2 class="mt-4">
          Playlist mappings
        </h2>
        <YouTubePlaylistMapping />

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
import {capitalize, computed, onMounted, ref} from "vue";
import {SettingType} from "@/types/ISettings";
import YouTubeConnectionInfo from "@/components/youtube/YouTubeConnectionInfo.vue";
import {PLAYOFF_BEST_OF_3, PLAYOFF_MATCH_TYPES} from "@/types/MatchType";
import AutosavingBtnSelectGroup from "@/components/form/AutosavingBtnSelectGroup.vue";
import {useSettingsStore} from "@/stores/settings";
import YouTubePlaylistMapping from "@/components/youtube/YouTubePlaylistMapping.vue";

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

// TODO: Move into its own component
const savingSandboxMode = ref(false);

async function saveSandboxMode(value: string): Promise<void> {
  savingSandboxMode.value = true;
  await submit("sandboxModeEnabled", value === "On", "setting");
  await refreshData(false);
  savingSandboxMode.value = false;
}

// TODO: Move into its own component
const savingUploadPrivacy = ref(false);

async function saveUploadPrivacy(value: string): Promise<void> {
  savingUploadPrivacy.value = true;
  await submit("youTubeVideoPrivacy", value.toLowerCase(), "setting");
  await refreshData(false);
  savingUploadPrivacy.value = false;
}

// TODO: Move into its own component
const savingTbaLinkVideos = ref(false);

async function saveTbaLinkVideos(value: string): Promise<void> {
  savingTbaLinkVideos.value = true;
  await submit("linkVideosOnTheBlueAlliance", value === "On", "setting");
  await refreshData(false);
  savingTbaLinkVideos.value = false;
}

const tbaReadApiKeyHelpText = computed((): string => {
  const baseText = "Generate a read API key from your account page on The Blue Alliance.";

  if (settingsStore.obfuscatedSecrets?.theBlueAllianceReadApiKey) {
    return `Current value hidden. ${baseText}`;
  }

  return baseText;
});

// TODO: Move into its own component
const savingFrcEventsApiKey = ref(false);

async function saveFrcEventsApiKey(value: string): Promise<void> {
  savingFrcEventsApiKey.value = true;
  await submit("useFrcEventsApi", value === "On", "setting");
  await refreshData(false);
  savingFrcEventsApiKey.value = false;
}

</script>

<style scoped>
i {
  opacity: 1 !important;
}
</style>
