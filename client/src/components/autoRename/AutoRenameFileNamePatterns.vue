<template>
  <!--      Reference for this set of dynamic inputs:
                https://dev.to/geekmaros/dynamically-add-remove-input-fields-using-vuejs-3d4d -->
  <p class="mb-2">
    File name patterns
  </p>
  <VAlert
    class="mb-4"
    variant="tonal"
    color="info"
    density="compact"
  >
    <p class="mb-2">
      Dates are parsed by the server using Luxon. See the
      <a href="https://moment.github.io/luxon/#/parsing?id=table-of-tokens">table of tokens</a>.
    </p>
    <p class="mb-2">
      Regex notation is <strong>not supported</strong>. If you have multiple possible patterns, add each as a separate
      entry.
      Auto Rename will try each pattern once per file until one successfully parses as a date.
    </p>
  </VAlert>
  <VAlert
    class="mb-4"
    variant="tonal"
    color="warning"
    density="compact"
    icon="mdi-wrench"
  >
    Sorry this is janky, but: To remove a file name pattern, empty its text box and click
    <strong>Save Patterns</strong>.
  </VAlert>
  <VAlert
    v-if="savePatternsError"
    variant="tonal"
    color="error"
    class="mb-4"
  >
    {{ savePatternsError }}
  </VAlert>
  <VAlert
    v-if="savePatternsSuccess"
    variant="tonal"
    color="success"
    class="mb-4"
  >
    Patterns updated successfully
  </VAlert>
  <VTextField
    v-for="(pattern, idx) in patterns"
    :key="idx"
    v-model="pattern.value"
    :disabled="savePatternsLoading"
    density="compact"
  />

  <VBtn
    prepend-icon="mdi-plus"
    variant="outlined"
    class="mt-2 mr-2 mb-8"
    :disabled="savePatternsLoading"
    @click="patterns.push({value:''})"
  >
    Add another
  </VBtn>
  <VBtn
    class="mt-2 mb-8"
    :loading="savePatternsLoading"
    @click="savePatterns"
  >
    Save patterns
  </VBtn>
</template>
<script lang="ts" setup>

import { ref } from "vue";
import { useSettingsStore } from "@/stores/settings";

const settingsStore = useSettingsStore();

const props = defineProps<{
  initialPatterns: {value: string}[];
}>();

// TODO: This no-setup-props-destructure rule is valid but not breaking the component
 
const patterns = ref(props.initialPatterns);

const savePatternsLoading = ref(false);
const savePatternsError = ref("");
const savePatternsSuccess = ref(false);
async function savePatterns() {
  savePatternsLoading.value = true;
  savePatternsSuccess.value = false;
  savePatternsError.value = "";

  if (patterns.value.some(pattern => pattern.value.includes(","))) {
    savePatternsError.value = "Commas are not allowed in file name patterns";
    savePatternsLoading.value = false;
    return;
  }

  const result = await settingsStore.saveSetting(
    "autoRenameFileNamePatterns",
    patterns.value
      .map(pattern => pattern.value.trim())
      .filter(pattern => pattern.trim() !== "")
      .join(","),
    "setting",
  );

  if (typeof result === "string") {
    savePatternsError.value = result;
    savePatternsLoading.value = false;
    return;
  }

  savePatternsLoading.value = false;
  savePatternsSuccess.value = true;
}
</script>
