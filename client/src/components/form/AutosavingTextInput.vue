<template>
  <VTextField
    variant="underlined"
    :disabled="state === State.LOADING"
    v-model="inputValue"
    :label="label"
    persistent-hint
    :hint="!!error ? error: (helpText || '')"
    :error="!!error"
    :type="calculatedInputType"
    @blur="submit()"
  >
    <template v-if="inputType === 'password'" v-slot:append-inner>
      <VIcon @click="togglePlaintext" v-if="showPlainText">mdi-eye-off</VIcon>
      <VIcon @click="togglePlaintext" v-else>mdi-eye</VIcon>
    </template>
    <template v-if="state !== State.READY" v-slot:append>
      <VIcon v-if="state === State.ERROR" color="error" class="mr-1">mdi-alert-circle-outline</VIcon>
      <VIcon color="success" v-if="state === State.SUCCESS">mdi-check</VIcon>
      <VProgressCircular indeterminate v-if="state===State.LOADING"></VProgressCircular>
    </template>
  </VTextField>
</template>


<script lang="ts" setup>
import {computed, ref} from "vue";
import {SettingType} from "@/types/ISettings";

enum State {
  LOADING,
  READY,
  SUCCESS,
  ERROR,
}

interface IProps {
  onSubmit: Function;
  name: string;
  label: string;
  initialValue: string|undefined;
  inputType: "text"|"password";
  settingType: SettingType;
  helpText?: string;
}

const props = defineProps<IProps>();

const state = ref<State>(State.READY)
const inputValue = ref(props.initialValue);
const lastSubmittedValue = ref(props.initialValue);
const error = ref("");
const showPlainText = ref(props.inputType === "text");

async function submit() {
  // Do not submit:
  // - in error state
  // - same value as most recent saved value
  // - empty value
  if (inputValue.value === "") {
    state.value = State.ERROR;
    error.value = "This field is required";
    return;
  }

  if (state.value !== State.ERROR && !error.value && inputValue.value === lastSubmittedValue.value) {
    return;
  }

  state.value = State.LOADING;
  lastSubmittedValue.value = inputValue.value;

  const returnValue = await props.onSubmit(props.name, inputValue.value, props.settingType);

  if (typeof returnValue === "boolean" && returnValue) {
    state.value = State.SUCCESS;
    error.value = "";
  } else {
    state.value = State.ERROR;

    if (typeof returnValue === "string") {
      error.value = returnValue;
    } else {
      error.value = "Save error"
    }
  }
}

const calculatedInputType = computed(() => {
  if (props.inputType === "password" && !showPlainText.value) {
    return "password";
  }

  return "text";
})

function togglePlaintext() {
  console.log("hi");
  showPlainText.value = !showPlainText.value
}

</script>

<style scoped>
.text-input-blue .v-text-field__slot input {
  color: #00f !important;
}

i {
  opacity: 1 !important;
}
</style>
