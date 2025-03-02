<template>
  <BaseDynamicTextInput
    :vInputComponent="VTextField"
    @blur="onBlur"
    :label="label"
    class="mt-4 mb-2"
    :help-text="helpText"
    :error="error"
    variant="underlined"
    v-model="testSettingsStore.settings[settingName].proposedValue"
  />
</template>
<script lang="ts" setup>

import { VTextField } from "vuetify/components";
import BaseDynamicTextInput from "@/components/form/BaseDynamicTextInput.vue";
import { ref } from "vue";
import { useTestSettingsStore } from "@/stores/settingsTest";

const props = defineProps<{
  settingName: "tbaEventCode";
  label: string;
  helpText?: string;
}>()

const success = ref(false);
const loading = ref(false);
const error = ref("");

const testSettingsStore = useTestSettingsStore();

async function onBlur(val: string | undefined) {
  loading.value = true;
  await testSettingsStore.saveSetting(props.settingName);
  loading.value = false;
  success.value = true;
}

</script>
