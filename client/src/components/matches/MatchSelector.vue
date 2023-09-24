<template>
  <v-autocomplete v-model="uploaderStore.selectedMatchKey"
                  :items="Object.values(uploaderStore.matches)"
                  rounded
                  auto-select-first
                  placeholder="Select a match..."
                  variant="outlined"
                  label="Match"
                  item-title="title"
                  item-value="matchKey"
                  @update:model-value="matchSelected"
  />
</template>

<script lang="ts" setup>
import {useMatchStore} from "@/stores/match";

const uploaderStore = useMatchStore();

async function matchSelected(matchKey: string) {
  console.log(matchKey);
  await uploaderStore.selectMatch(matchKey);
}
</script>
