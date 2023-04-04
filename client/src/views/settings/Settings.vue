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
        </VForm>

        <h2>YouTube</h2>

        <h3 class="mb-2">OAuth2 client details</h3>
        <VAlert v-if="!youTubeAuthState?.accessTokenStored"
                class="mb-3"
        >
          In your Google Cloud project, create an OAuth2 web client.<br />
          <br />
          Be sure to add <code>http://localhost:3000/api/v1/youtube/auth/callback</code> as an authorized redirect.
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
import {onMounted, ref} from "vue";
import {ISettings, SettingType} from "@/types/ISettings";
import YouTubeConnectionInfo from "@/components/youtube/YouTubeConnectionInfo.vue";
import {IYouTubeAuthState} from "@/types/youtube/IYouTubeAuthState";

const loading = ref(true);
const error = ref("");
const settings = ref<ISettings | null>(null);
const youTubeAuthState = ref<IYouTubeAuthState | null>(null);
const dataRefreshKey = ref(1);

function handleApiError(result: Response, message: string) {
  if (!result.ok) {
    error.value = `API error (${result.status} ${result.statusText}): ${message}`;
    return true;
  }

  return false;
}

async function refreshData() {
  const [settingsResult, youtubeAuthStatusResult] = await Promise.all([
    fetch("/api/v1/settings"),
    fetch("/api/v1/youtube/auth/status"),
  ]);

  if (handleApiError(settingsResult, "Unable to load settings")
    || handleApiError(youtubeAuthStatusResult, "Unable to load YouTube auth status")
  ) {
    return;
  }

  [settings.value, youTubeAuthState.value] = await Promise.all([
    settingsResult.json(),
    youtubeAuthStatusResult.json(),
  ]);

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
</script>

<style scoped>
i {
  opacity: 1 !important;
}
</style>
