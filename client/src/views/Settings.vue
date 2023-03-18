<template>
    <h1>Settings</h1>
    <v-row>
      <v-col>
        <v-progress-circular indeterminate v-if="loading" />
        <v-form v-else @submit.prevent class="settings-form mt-4">
          <autosaving-text-input :on-submit="submit"
                                 :initial-value="settings?.eventName"
                                 name="eventName"
                                 label="Event name"
          />
          <autosaving-text-input :on-submit="submit"
                                 :initial-value="settings?.eventTbaCode"
                                 name="eventTbaCode"
                                 label="Event TBA code"
          />
          <autosaving-text-input :on-submit="submit"
                                 :initial-value="settings?.videoSearchDirectory"
                                 name="videoSearchDirectory"
                                 label="Video search directory"
          />
        </v-form>
      </v-col>
    </v-row>

</template>

<script lang="ts" setup>
import AutosavingTextInput from "@/components/form/AutosavingTextInput.vue";
import {onMounted, ref} from "vue";
import {ISettings} from "@/types/ISettings";

// TODO(evan10s): use a custom hook for this?
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
.settings-form {
  max-width: 300px;
}

i {
  opacity: 1 !important;
}
</style>
