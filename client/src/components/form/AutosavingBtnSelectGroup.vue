<template>
  <div class="d-flex flex-wrap">
    <VBtn v-for="value in choices"
          :key="value"
          class="mr-2 mb-2 text-none no-transition"
          :variant="valueIsSelected(value) ? 'flat' : 'outlined'"
          :value="value"
          :disabled="!!loading"
          color="primary"
          :ripple="false"
          :prepend-icon="getPrependIcon(value)"
          @click="() => onChoiceSelected(value)"
    >
      {{ value }}
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
import {ref} from "vue";

interface IProps {
  /**
   *  The choices to be rendered as one button per choice. Note that each choice should be a unique value or else
   *  things won't work right.
   */
  choices: string[],
  /**
   * If a non-null value is provided and is one of the provided choices, then that button will be selected by default
   */
  defaultValue?: string,
  loading?: boolean,
}

const props = defineProps<IProps>();

interface IEmits {
  (e: "onChoiceSelected", value: string): void | Promise<void>,
}

const emit = defineEmits<IEmits>();

// const selectedValue = toRef(props, "defaultValue") ?? ref<string|null>(null);
const selectedValue = ref<string|null>(null);

function valueIsSelected(value: string): boolean {
  if (selectedValue.value === null) {
    return value === props.defaultValue;
  }

  return value === selectedValue.value;
}

function onChoiceSelected(value: string): void {
  selectedValue.value = value;
  emit("onChoiceSelected", value);
}

function getPrependIcon(value: string): string|undefined {
  const selected = valueIsSelected(value);

  if (props.loading && selected) {
    return "mdi-loading mdi-spin";
  }

  if (selected) {
    return "mdi-check";
  }
}

</script>

<style scoped>
.no-transition {
  transition: none;
}
</style>
