<template>
  <BaseDynamicTextInput
    v-if="!settingsStore.isFirstLoad && settingsStore[settingNamespace]"
    :vInputComponent="VTextField"
    @blur="onBlur"
    :label="label"
    class="mt-4 mb-2"
    :help-text="helpText"
    :error="error"
    variant="underlined"
    :loading="loading"
    :success="success"
    v-model="settingsStore[settingNamespace][settingName].proposedValue"
  />
</template>
<script lang="ts" setup>

import { VTextField } from "vuetify/components";
import BaseDynamicTextInput from "@/components/form/BaseDynamicTextInput.vue";
import { ref } from "vue";
import { ISettings, SaveSettingResult, SettingNamespace, SettingType } from "@/types/ISettings";
import { useSettingsStore } from "@/stores/settings";

const settingsStore = useSettingsStore();

const emit = defineEmits<{
  beforeSave: [];
  afterSave: [];
}>()

const props = defineProps<{
  settingNamespace: SettingNamespace;
  settingName: keyof ISettings;
  settingType: SettingType;
  label: string;
  helpText?: string;
  onSave: (settingName: keyof ISettings, value: string | undefined, type: SettingType) => Promise<SaveSettingResult>;
}>()

const success = ref(false);
const loading = ref(false);
const error = ref("");

async function onBlur(val: string | undefined) {
  loading.value = true;
  success.value = false;
  error.value = "";

  emit("beforeSave");

  const result = await props.onSave(props.settingName, settingValue.value, props.settingType);

  if (result.success) {
    success.value = true;
  } else {
    error.value = result.error ?? "Unknown error occurred while saving setting";
  }

  loading.value = false;

  emit("afterSave");
}

</script>
