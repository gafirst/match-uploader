<template>
  <VAlert v-if="!!matchListStore.error"
          color="error"
          class="mb-4"
  >
    {{ matchListStore.error }}
  </VAlert>
  <!--
  Note: this component may be laggy when running in development, but in production builds the performance
  should become significantly better.
  -->
  <v-autocomplete v-model="matchStore.selectedMatchKey"
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
  <VRow class="mb-2">
    <VBtn :disabled="matchStore.uploadInProgress"
          prepend-icon="mdi-refresh"
          variant="outlined"
          class="ml-4"
          @click="matchListStore.getMatchList(true)"
    >
      Refresh
    </VBtn>
    <!--    A button to view the match on The Blue Alliance-->
    <VBtn v-if="matchStore.selectedMatchKey"
          prepend-icon="mdi-open-in-new"
          variant="outlined"
          class="ml-2"
          :href="`https://thebluealliance.com/match/${matchStore.selectedMatchKey}`"
          target="_blank"
    >
      View on TBA
    </VBtn>
  </VRow>
</template>

<script lang="ts" setup>
import {useMatchStore} from "@/stores/match";
import {useMatchListStore} from "@/stores/matchList";
import {onMounted} from "vue";

const matchStore = useMatchStore();
const matchListStore = useMatchListStore();

onMounted(() => {
  matchListStore.getMatchList();
});

async function matchSelected(matchKey: string) {
  console.log(matchKey);
  await matchStore.selectMatch(matchKey);
}
</script>
