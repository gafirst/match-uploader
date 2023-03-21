<template>
  <VTextField
    variant="underlined"
    :disabled="state === State.LOADING"
    v-model="inputValue"
    :label="label"
    persistent-hint
    :hint="error"
    :error="!!error"
    @blur="submit()"
  >
    <template v-if="state === State.SUCCESS" v-slot:append>
      <VIcon color="success">mdi-check</VIcon>
    </template>
    <template v-else-if="state === State.LOADING" v-slot:append>
      <VProgressCircular indeterminate></VProgressCircular>
    </template>
    <template v-else-if="state === State.ERROR" v-slot:append>
      <VIcon color="error" class="mr-1">mdi-alert-circle-outline</VIcon>
    </template>
  </VTextField>
</template>


<script lang="ts" setup>
import {ref} from "vue";

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
}

const props = defineProps<IProps>();

const state = ref<State>(State.READY)
const inputValue = ref(props.initialValue);
const lastSubmittedValue = ref(props.initialValue);
const error = ref("");

async function submit() {
  if (inputValue.value === lastSubmittedValue.value) {
    return;
  }

  state.value = State.LOADING;
  lastSubmittedValue.value = inputValue.value;

  const returnValue = await props.onSubmit(props.name, inputValue.value);

  if (typeof returnValue === "boolean" && returnValue) {
    state.value = State.SUCCESS;
  } else {
    state.value = State.ERROR;

    if (typeof returnValue === "string") {
      error.value = returnValue;
    } else {
      error.value = "Save error"
    }
  }
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
