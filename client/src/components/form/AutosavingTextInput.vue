<template>
  <!-- TODO: Autosaving textarea should be either a separate component or this should be more flexible somehow -->
  <VTextarea
    v-if="inputType === 'textarea'"
    v-model="inputValue"
    :label="label"
    :disabled="state === State.LOADING || !!disabled"
    persistent-hint
    :hint="!!error ? error: (helpText || '')"
    :error="!!error"
    auto-grow
    @blur="submit()"
  >
    <template
      v-if="state !== State.READY"
      #append
    >
      <VIcon
        v-if="state === State.ERROR"
        color="error"
        class="mr-1"
      >
        mdi-alert-circle-outline
      </VIcon>
      <VIcon
        v-if="state === State.SUCCESS"
        color="success"
      >
        mdi-check
      </VIcon>
      <VProgressCircular
        v-if="state===State.LOADING"
        indeterminate
      />
    </template>
  </VTextarea>
  <VTextField
    v-else
    v-model="inputValue"
    variant="underlined"
    :disabled="state === State.LOADING || !!disabled"
    :label="label"
    persistent-hint
    :hint="!!error ? error: (helpText || '')"
    :error="!!error"
    :type="calculatedInputType"
    @blur="submit()"
  >
    <template
      v-if="inputType === 'password'"
      #append-inner
    >
      <VIcon
        v-if="showPlainText"
        @click="togglePlaintext"
      >
        mdi-eye-off
      </VIcon>
      <VIcon
        v-else
        @click="togglePlaintext"
      >
        mdi-eye
      </VIcon>
    </template>
    <template
      v-if="state !== State.READY"
      #append
    >
      <VIcon
        v-if="state === State.ERROR"
        color="error"
        class="mr-1"
      >
        mdi-alert-circle-outline
      </VIcon>
      <VIcon
        v-if="state === State.SUCCESS"
        color="success"
      >
        mdi-check
      </VIcon>
      <VProgressCircular
        v-if="state===State.LOADING"
        indeterminate
      />
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  onSubmit: Function;
  name: string;
  label: string;
  initialValue: string|undefined;
  inputType: "text"|"password"|"textarea";
  settingType: SettingType|"descriptionTemplate";
  helpText?: string;
  disabled?: boolean;
}

const props = defineProps<IProps>();
const emit = defineEmits(["savedValueUpdated"]);

const state = ref<State>(State.READY);

// TODO: These no-setup-props-destructure rules are valid but not breaking the component

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
    emit("savedValueUpdated");
  } else {
    state.value = State.ERROR;

    if (typeof returnValue === "string") {
      error.value = returnValue;
    } else {
      error.value = "Save error";
    }
  }
}

const calculatedInputType = computed(() => {
  if (props.inputType === "password" && !showPlainText.value) {
    return "password";
  }

  return props.inputType;
});

function togglePlaintext() {
  showPlainText.value = !showPlainText.value;
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
