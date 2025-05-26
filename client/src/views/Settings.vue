<template>
  <h1>Settings</h1>
  <VRow>
    <VCol md="6">
      <VProgressCircular
        v-if="loading"
        indeterminate
      />
      <VAlert
        v-else-if="!!error"
        color="error"
      >
        {{ error }}
      </VAlert>
      <div v-else>
        <h2>General</h2>
        <SettingsTextInput v-if="!settingsStore.isFirstLoad && settingsStore.settings?.eventName"
          setting-name="eventName" label="Event name"
                           setting-type="setting"
                           v-model="settingsStore.rawSettings.eventName.proposedValue"
                           :on-save="settingsStore.saveSetting"
        />

        <VAlert
          v-if="matchStore.selectedMatchKey"
          class="mb-4"
          color="warning"
        >
          Changing the event code will clear the current selected match.
        </VAlert>
<!--        FIXME: figure out how to reimplement post-actions on tba code change-->
<!--        <SettingsTextInput setting-name="eventTbaCode" label="Event TBA code" />-->

        <p class="mb-1">
          Playoffs type
        </p>
        <VAlert
          v-if="settingsStore.settings?.playoffsType === PLAYOFF_BEST_OF_3"
          color="warning"
          variant="tonal"
          class="mb-2"
        >
          Best of 3 playoff support is limited and functionality may be broken or limited in this playoff mode.
        </VAlert>
        <AutosavingBtnSelectGroup
          :choices="PLAYOFF_MATCH_TYPES"
          :default-value="settingsStore.settings?.playoffsType"
          :loading="savingPlayoffMatchType"
          @on-choice-selected="savePlayoffMatchType"
        />

        <p class="mb-1">
          Sandbox mode
        </p>
        <AutosavingBtnSelectGroup
          :choices="['On', 'Off']"
          :default-value="settingsStore.settings?.sandboxModeEnabled ? 'On' : 'Off'"
          :loading="savingSandboxMode"
          @on-choice-selected="saveSandboxMode"
        />

        <p class="mb-1">
          Video upload privacy
        </p>
        <AutosavingBtnSelectGroup
          :choices="['Public', 'Unlisted', 'Private']"
          :default-value="capitalize(settingsStore.settings?.youTubeVideoPrivacy ?? 'public')"
          :loading="savingUploadPrivacy"
          @on-choice-selected="saveUploadPrivacy"
        />

        <h2 class="mb-1">
          Video description template
        </h2>
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
              <br>
              <p>Available variables:</p>
              <ul class="ml-4">
                <li>
                  <code>eventName</code> - Value of the event name setting (current value:
                  <code>{{ settingsStore.settings?.eventName ?? "Loading..." }}</code>)
                </li>
                <li>
                  <code>isMatch</code> - true if this is a match video, false otherwise (i.e., this is an event media
                  upload). Use in an <code>if</code> block like <code v-pre>{{#isMatch}} ... {{/isMatch}} </code>
                </li>
                <li>
                  <code>mediaTitle</code> - properly capitalized title for the video. When using, enclose in triple
                  curly braces: <code v-pre>{{{mediaTitle}}}</code> (example: <code>Qualification Match 1</code>,
                  <code>Playoff Match 3 (R1)</code>, or <code>Alliance Selection</code>)
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
                  <code>eventDetailsSite </code> - either <code>The Blue Alliance</code> or <code>FRC Events</code>
                  depending on the currently selected event/match data source
                </li>
                <li>
                  <code>details</code> <strong>(contains URL)</strong> - URL where full match results or event info can
                  be viewed (links to The Blue Alliance or FRC Events depending on the currently selected match data
                  source) (example: <code>https://www.thebluealliance.com/match/2023gaalb_sf1m1</code> or
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
        <VAlert
          v-if="matchStore.selectedMatchKey"
          class="mb-4"
          color="warning"
        >
          <p>
            If you change the
            description template here, you must press the <strong>Regenerate Description</strong> button on the
            Upload page to update the description for the current match with the latest changes.
          </p>
        </VAlert>
        <AutosavingTextInput
          :key="`descriptionTemplate-${dataRefreshKey}`"
          :on-submit="saveDescriptionTemplate"
          :initial-value="settingsStore.descriptionTemplate ?? undefined"
          name="descriptionTemplate"
          label="Template for YouTube video descriptions"
          input-type="textarea"
          setting-type="descriptionTemplate"
          help-text="Updating this value will *not* affect any currently queued videos."
        />

        <h2 class="mt-4">
          The Blue Alliance (TBA)
        </h2>
        <h3>Read API</h3>
        <AutosavingTextInput
          :key="`theBlueAllianceReadApiKey-${dataRefreshKey}`"
          :on-submit="submit"
          initial-value=""
          name="theBlueAllianceReadApiKey"
          label="TBA read API key"
          input-type="password"
          setting-type="secret"
          :help-text="tbaReadApiKeyHelpText"
        />

        <h3 class="mt-2">
          Trusted (write) API
        </h3>
        <p>
          You can use TBA's trusted API to associate uploaded videos with matches on TBA. To use this feature,
          you must request write tokens for your event on
          <a href="https://www.thebluealliance.com/request/apiwrite/">
            https://www.thebluealliance.com/request/apiwrite/
          </a>
        </p>

        <p class="mt-4">
          Link match videos on TBA
        </p>
        <AutosavingBtnSelectGroup
          :choices="['On', 'Off']"
          :default-value="settingsStore.settings?.linkVideosOnTheBlueAlliance ? 'On' : 'Off'"
          :loading="savingTbaLinkVideos"
          @on-choice-selected="saveTbaLinkVideos"
        />

        <AutosavingTextInput
          v-if="settingsStore.settings?.linkVideosOnTheBlueAlliance"
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

        <AutosavingTextInput
          v-if="settingsStore.settings?.linkVideosOnTheBlueAlliance"
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

        <VAlert
          v-if="matchStore.selectedMatchKey"
          class="mb-4"
          color="warning"
        >
          Toggling the FRC Events setting will regenerate the description for the current match.
        </VAlert>

        <p class="mt-4">
          Retrieve match data from FRC Events
        </p>
        <AutosavingBtnSelectGroup
          :choices="['On', 'Off']"
          :default-value="settingsStore.settings?.useFrcEventsApi ? 'On' : 'Off'"
          :loading="savingFrcEventsEnabled"
          @on-choice-selected="saveFrcEventsEnabled"
        />

        <AutosavingTextInput
          v-if="settingsStore.settings?.useFrcEventsApi"
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

        <h3 class="mb-2">
          OAuth2 client details
        </h3>
        <VAlert
          v-if="!settingsStore.youTubeAuthState?.accessTokenStored"
          class="mb-3"
        >
          In your Google Cloud project, create an OAuth2 web client.<br>
          <br>
          <div v-if="settingsStore.youTubeOAuth2RedirectUri">
            Make sure to add the following as an authorized redirect URI:
            <VTextField
              :value="settingsStore.youTubeOAuth2RedirectUri"
              readonly
              variant="underlined"
              @focus="$event.target.select()"
            >
              <template #append>
                <VBtn
                  :color="youTubeOAuth2RedirectCopyBtnColor"
                  @click="copyYouTubeOAuth2RedirectUri"
                >
                  {{ youTubeOAuth2RedirectCopyBtnText }}
                </VBtn>
              </template>
            </VTextField>
          </div>
        </VAlert>
        <VAlert
          v-if="settingsStore.youTubeAuthState?.accessTokenStored"
          class="mb-3"
          color="info"
          variant="tonal"
        >
          You currently have an active YouTube connection. Use the <strong>Reset YouTube Connection</strong> button
          below to adjust your YouTube OAuth2 client details.
        </VAlert>
        <AutosavingTextInput
          :on-submit="submit"
          :initial-value="settingsStore.settings?.googleClientId"
          name="googleClientId"
          label="OAuth2 client ID"
          :disabled="settingsStore.youTubeAuthState?.accessTokenStored"
          input-type="text"
          setting-type="setting"
          @saved-value-updated="() => refreshData(false)"
        />

        <AutosavingTextInput
          :on-submit="submit"
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
        <YouTubeConnectionInfo
          :google-auth-status="settingsStore.settings?.googleAuthStatus"
          :you-tube-auth-state="settingsStore.youTubeAuthState"
          @trigger-refresh="refreshData"
        />
        <h2 class="mt-4 mb-2">
          Auto rename <VChip color="purple">
            Beta
          </VChip>
        </h2>
        <VAlert
          color="purple"
          variant="tonal"
          density="compact"
          icon="mdi-bug-outline"
        >
          Report bugs and send feedback
          <a
            target="_blank"
            href="https://github.com/gafirst/match-uploader/issues/new/choose"
          >on GitHub</a>.
        </VAlert>
        <h3 class="mt-4 mb-2">
          Advanced auto rename settings
        </h3>
        <VAlert
          class="mb-2"
          variant="tonal"
          color="warning"
        >
          Changing these settings can affect the accuracy of automated associations made by Auto Rename. Proceed with
          caution.
        </VAlert>
        <AutoRenameFileNamePatterns
          v-if="!settingsStore.isFirstLoad
            && settingsStore.settings?.autoRenameFileNamePatterns"
          :initial-patterns="settingsStore.settings
            .autoRenameFileNamePatterns.split(',').map((value) => { return { value }; })"
        />
        <AutosavingTextInput
          :on-submit="submit"
          class="mb-2"
          :initial-value="settingsStore.settings?.autoRenameMinExpectedVideoDurationSecs"
          name="autoRenameMinExpectedVideoDurationSecs"
          label="Minimum expected video duration (seconds)"
          input-type="text"
          help-text="Default: 180 | Associations will be marked weak if the video duration is
                             shorter than this"
          setting-type="setting"
        />
        <AutosavingTextInput
          :on-submit="submit"
          class="mb-2"
          :initial-value="settingsStore.settings?.autoRenameMaxExpectedVideoDurationSecs"
          name="autoRenameMaxExpectedVideoDurationSecs"
          label="Maximum expected video duration (seconds)"
          input-type="text"
          help-text="Default: 420 | Associations will be marked weak if the video duration is
                             longer than this"
          setting-type="setting"
        />
        <AutosavingTextInput
          :on-submit="submit"
          class="mb-2"
          :initial-value="settingsStore.settings?.autoRenameMaxStartTimeDiffSecStrong"
          name="autoRenameMaxStartTimeDiffSecStrong"
          label="Max start time difference (seconds) for a strong association"
          input-type="text"
          help-text="Default: 60 | Associations will be marked strong when the match start time and
                             video filename timestamp are not more than this many seconds apart"
          setting-type="setting"
        />
        <AutosavingTextInput
          :on-submit="submit"
          class="mb-2"
          :initial-value="settingsStore.settings?.autoRenameMaxStartTimeDiffSecWeak"
          name="autoRenameMaxStartTimeDiffSecWeak"
          label="Max start time difference (seconds) for a weak association"
          input-type="text"
          help-text="Default: 300 | Associations will be marked weak when the match start time and
                             video filename timestamp are not more than this many seconds apart"
          setting-type="setting"
        />
        <AutosavingTextInput
          :on-submit="submit"
          class="mb-2"
          :initial-value="settingsStore.settings?.autoRenameFileRenameJobDelaySecs"
          name="autoRenameFileRenameJobDelaySecs"
          label="Rename job delay for strong associations"
          input-type="text"
          help-text="Default: 300 | After a strong association is made, the job to rename the file
                             (and thus make it available to upload) will be delayed this many seconds to allow undoing
                             or modifying the association if needed"
          setting-type="setting"
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
import { useMatchStore } from "@/stores/match";
import { useMatchListStore } from "@/stores/matchList";
import AutoRenameFileNamePatterns from "@/components/autoRename/AutoRenameFileNamePatterns.vue";
import { useUploadedVideosStore } from "@/stores/uploadedVideos";
import { useAutoRenameStore } from "@/stores/autoRename";
import { useEventMediaStore } from "@/stores/eventMedia";
import AutosavingTextInputV2 from "@/components/form/AutosavingTextInputV2.vue";
import { useSettingsStoreV2 } from "@/stores/settingsV2";
import { VTextarea, VTextField } from "vuetify/components";
import BaseDynamicTextInput from "@/components/form/BaseDynamicTextInput.vue";
import SettingsTextInput from "@/components/form/SettingsTextInput.vue";

const loading = computed(() => {
  return settingsStore.loading;
});

const error = computed(() => {
  return settingsStore.error;
});
const matchStore = useMatchStore();
const matchListStore = useMatchListStore();
const settingsStore = useSettingsStore();
const uploadedVideosStore = useUploadedVideosStore();
const autoRenameStore = useAutoRenameStore();
const eventMediaStore = useEventMediaStore();


const testSettingsStore = useSettingsStoreV2();


const dataRefreshKey = ref(1);
const youTubeOAuth2RedirectUriCopied = ref(false);
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

async function submitEventName(settingName: string, value: string | boolean, settingType: SettingType) {
  // TODO(#114): Ideally we could alert other client instances that the event name has changed
  const submitResult = await submit(settingName, value, settingType);
  await matchStore.getMatchVideos();
  return submitResult;
}

async function submitEventCode(settingName: string, value: string | boolean, settingType: SettingType) {
  // TODO(#114): Ideally we could alert other client instances that the event code has changed
  const submitResult = await submit(settingName, value, settingType);
  await matchListStore.getMatchList(true);
  matchStore.clearSelectedMatch();
  await uploadedVideosStore.getMatchUploadStatuses();
  await autoRenameStore.getAssociations(true);
  return submitResult;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function saveDescriptionTemplate(settingName: string, value: string, settingType: SettingType) {
  return await settingsStore.saveDescriptionTemplate(value);
}

async function savePlayoffMatchType(value: string): Promise<void> {
  savingPlayoffMatchType.value = true;
  await submit("playoffsType", value, "setting");
  await refreshData(false);
  savingPlayoffMatchType.value = false;
  await matchListStore.getMatchList(true);
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
const savingFrcEventsEnabled = ref(false);

async function saveFrcEventsEnabled(value: string): Promise<void> {
  savingFrcEventsEnabled.value = true;
  await submit("useFrcEventsApi", value === "On", "setting");
  await refreshData(false);
  savingFrcEventsEnabled.value = false;
  matchStore.descriptionLoading = true;
  eventMediaStore.descriptionLoading = true;
  await eventMediaStore.getSuggestedDescription();
  await matchListStore.getMatchList(true);
  await matchStore.getSuggestedDescription();
}
</script>

<style scoped>
i {
  opacity: 1 !important;
}
</style>
