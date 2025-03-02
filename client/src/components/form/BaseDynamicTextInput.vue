<template>
  <component
    :is="vInputComponent"
    v-model="inputValue"
    :disabled="loading || disabled"
    :label="label"
    persistent-hint
    :hint="!!error ? error : (helpText || '')"
    :error="!!error"
    :type="computedInputType"
    @blur="onBlur()"
  >
    <template
      v-if="hideValue"
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
      v-if="!!error || success || loading"
      #append
    >
      <VIcon
        v-if="!!error"
        color="error"
        class="mr-1"
      >
        mdi-alert-circle-outline
      </VIcon>
      <VIcon
        v-if="success"
        color="success"
      >
        mdi-check
      </VIcon>
      <VProgressCircular
        v-if="loading"
        indeterminate
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { VInput, VTextarea, VTextField } from "vuetify/components";

const props = defineProps<{
  vInputComponent: VTextField | VTextarea | VInput;
  label: string;
  helpText?: string;
  hideValue?: boolean;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  blur: [value: string | undefined];
}>();

const inputValue = defineModel<string>();

const computedInputType = computed(() => {
  return !props.hideValue || showPlainText.value ? "text" : "password";
});

const showPlainText = ref(!props.hideValue);

async function onBlur() {
  emit("blur", inputValue.value);
}

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
