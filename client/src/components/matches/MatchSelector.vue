<template>
  <v-autocomplete v-model="matchStore.selectedMatchKey"
                  :items="Object.values(matchStore.matches)"
                  rounded
                  auto-select-first
                  placeholder="Select a match..."
                  variant="outlined"
                  label="Match"
                  item-title="title"
                  item-value="matchKey"
                  :disabled="matchStore.uploadInProgress"
                  @update:model-value="matchSelected"
  />
</template>

<script lang="ts" setup>
import {useMatchStore} from "@/stores/match";

const matchStore = useMatchStore();

async function matchSelected(matchKey: string) {
  console.log(matchKey);
  await matchStore.selectMatch(matchKey);
}
</script>
