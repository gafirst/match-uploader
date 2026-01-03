<template>
  <!--
  Note: this component may be laggy when running in development, but in production builds the performance
  should become significantly better.
  -->
  <v-autocomplete
    :model-value="model"
    class="mt-6"
    :items="matchListStore.matches"
    :loading="matchListStore.loading || loading"
    rounded
    auto-select-first
    placeholder="Select a match..."
    variant="outlined"
    label="Match"
    item-title="verboseName"
    item-value="key"
    :disabled="!!matchListStore.error || disabled"
    autocomplete="off"
    @update:model-value="matchSelected"
  />
</template>
<script lang="ts" setup>
import { defineModel } from "vue";
import { useMatchListStore } from "@/stores/matchList";

defineProps<{
  loading?: boolean;
  disabled?: boolean
}>();

const matchListStore = useMatchListStore();

matchListStore.getMatchList();

// eslint-disable-next-line vue/require-prop-types
const model = defineModel();

function matchSelected(value: string) {
  console.log(value);
  model.value = value;
}
</script>
