<template>
    <h1>Settings</h1>
    <VRow>
      <VCol md="6">
        <h2>General</h2>
        <VProgressCircular indeterminate v-if="loading" />
        <VForm v-else @submit.prevent class="mt-4">
          <AutosavingTextInput :on-submit="submit"
                                 :initial-value="settings?.eventName"
                                 name="eventName"
                                 label="Event name"
          />
          <AutosavingTextInput :on-submit="submit"
                                 :initial-value="settings?.eventTbaCode"
                                 name="eventTbaCode"
                                 label="Event TBA code"
          />
          <AutosavingTextInput :on-submit="submit"
                                 :initial-value="settings?.videoSearchDirectory"
                                 name="videoSearchDirectory"
                                 label="Video search directory"
          />
        </VForm>

        <h2>YouTube</h2>
        <YouTubeAuth />
      </VCol>
    </VRow>

</template>

<script lang="ts" setup>
import AutosavingTextInput from "@/components/form/AutosavingTextInput.vue";
import {onMounted, ref} from "vue";
import {ISettings} from "@/types/ISettings";
import YouTubeAuth from "@/components/youtube/YouTubeAuth.vue";

const loading = ref(true);
const error = ref("");
const settings = ref<ISettings|null>(null);

onMounted(async () => {
  const result = await fetch("/api/v1/settings");

  if (!result.ok) {
    loading.value = false;
    error.value = `Unable to load settings: ${result.status} ${result.statusText}`
    return;
  }

  settings.value = await result.json();
  loading.value = false;
})

async function submit(settingName: string, value: string) {
  console.log(value);
  const submitResult = await fetch(`/api/v1/settings/${settingName}`, {
    method: "POST",
    body: JSON.stringify({
      value,
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
