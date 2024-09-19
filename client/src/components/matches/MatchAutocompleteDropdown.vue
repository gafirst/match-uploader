<template>
  <!--
  Note: this component may be laggy when running in development, but in production builds the performance
  should become significantly better.
  -->
  <v-autocomplete v-model="matchStore.selectedMatchKey"
                  class="mt-6"
                  :items="matchListStore.matches"
                  :loading="matchListStore.loading"
                  rounded
                  auto-select-first
                  placeholder="Select a match..."
                  variant="outlined"
                  label="Match"
                  item-title="verboseName"
                  item-value="key"
                  :disabled="matchStore.uploadInProgress || !!matchListStore.error"
                  @update:model-value="matchSelected"
  />
</template>
<script lang="ts" setup>

import { useMatchListStore } from "@/stores/matchList";
import { useMatchStore } from "@/stores/match";

const matchListStore = useMatchListStore();
const matchStore = useMatchStore();

matchListStore.getMatchList();

function matchSelected() {
  console.log("Match selected");
}
</script>
