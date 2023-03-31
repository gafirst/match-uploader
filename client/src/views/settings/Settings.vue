<template>
  <h1>Settings</h1>
  <VRow>
    <VCol md="6">
      <VProgressCircular indeterminate v-if="loading"/>
      <VAlert v-else-if="!!error"
              color="error"
      >
        {{ error }}
      </VAlert>
      <div v-else>
        <h2>General</h2>
        <VForm @submit.prevent class="mt-4">
          <AutosavingTextInput :on-submit="submit"
                               :initial-value="settings?.eventName"
                               name="eventName"
                               label="Event name"
                               input-type="text"
                               setting-type="setting"
          />
          <AutosavingTextInput :on-submit="submit"
                               :initial-value="settings?.eventTbaCode"
                               name="eventTbaCode"
                               label="Event TBA code"
                               input-type="text"
                               setting-type="setting"
          />
          <AutosavingTextInput :on-submit="submit"
                               :initial-value="settings?.videoSearchDirectory"
                               name="videoSearchDirectory"
                               label="Video search directory"
                               input-type="text"
                               setting-type="setting"
          />
        </VForm>

        <h2>YouTube</h2>

        <h3 class="mb-2">OAuth2 client details</h3>
        <VAlert class="mb-3">In your Google Cloud project, create an OAuth2 web client.<br />
          <br />
          Be sure to add <code>http://localhost:3000/auth/youtube/callback</code> as an authorized redirect.
        </VAlert>
        <AutosavingTextInput :on-submit="submit"
                             :initial-value="settings?.googleClientId"
                             name="googleClientId"
                             label="OAuth2 client ID"
                             input-type="text"
                             setting-type="setting"
        />

        <AutosavingTextInput :on-submit="submit"
                             initial-value=""
                             name="googleClientSecret"
                             label="OAuth2 client secret"
                             help-text="Current value hidden"
                             input-type="password"
                             setting-type="secret"
                             class="mb-3"
        />
        <YouTubeConnectionInfo :google-auth-status="settings?.googleAuthStatus" />
      </div>

    </VCol>
  </VRow>

</template>

<script lang="ts" setup>
import AutosavingTextInput from "@/components/form/AutosavingTextInput.vue";
import {onMounted, ref} from "vue";
import {ISettings, SettingType} from "@/types/ISettings";
import YouTubeAuth from "@/components/youtube/YouTubeAuth.vue";
import YouTubeConnectionInfo from "@/components/youtube/YouTubeConnectionInfo.vue";

const loading = ref(true);
const error = ref("");
const settings = ref<ISettings | null>(null);

onMounted(async () => {
  const settingsResult = await fetch("/api/v1/settings");

  if (!settingsResult.ok) {
    loading.value = false;
    error.value = `Unable to load settings: ${settingsResult.status} ${settingsResult.statusText}`
    return;
  }

  settings.value = await settingsResult.json();
  loading.value = false;
})

async function submit(settingName: string, value: string, settingType: SettingType) {
  console.log(value);
  const submitResult = await fetch(`/api/v1/settings/${settingName}`, {
    method: "POST",
    body: JSON.stringify({
      value,
      settingType,
    }),
    headers: {
      "Content-Type": "application/json",
    }
  })

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
