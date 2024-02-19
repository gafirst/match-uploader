<template>
  <VRow class="mb-1">
    <VCol>
      <MatchDataAttribution class="mb-4" />
      <VAlert v-if="!!matchListStore.error"
              color="error"
              variant="tonal"
              class="mb-2"
      >
        {{ matchListStore.error }}
      </VAlert>

      <VAlert v-if="!!matchStore.nextMatchError"
              color="warning"
              variant="tonal"
              class="mb-2"
      >
        {{ matchStore.nextMatchError }}
      </VAlert>
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
      <VBtn :disabled="matchStore.uploadInProgress"
            prepend-icon="mdi-refresh"
            variant="outlined"
            class="mr-2 mb-2"
            @click="matchListStore.getMatchList(true)"
      >
        Refresh
      </VBtn>
      <VBtn v-if="!settingsStore.settings?.useFrcEventsApi && matchStore.selectedMatchKey"
            prepend-icon="mdi-open-in-new"
            variant="outlined"
            class="mr-2 mb-2"
            :href="`https://thebluealliance.com/match/${matchStore.selectedMatchKey}`"
            target="_blank"
      >
        View on TBA
      </VBtn>
      <VBtn v-if="matchStore.selectedMatchKey"
            :variant="!matchStore.allMatchVideosQueued ? 'outlined' : undefined"
            :disabled="matchStore.uploadInProgress"
            :loading="matchStore.nextMatchLoading"
            prepend-icon="mdi-skip-next"
            class="mb-2"
            @click="matchStore.advanceMatch"
      >
        Next match
      </VBtn>
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import {useMatchStore} from "@/stores/match";
import {useMatchListStore} from "@/stores/matchList";
import {onMounted} from "vue";
import FrcEventsWarning from "@/components/alerts/FrcEventsWarning.vue";
import {useSettingsStore} from "@/stores/settings";
import MatchDataAttribution from "@/components/matches/MatchDataAttribution.vue";

const matchStore = useMatchStore();
const matchListStore = useMatchListStore();
const settingsStore = useSettingsStore();

onMounted(() => {
  matchListStore.getMatchList();
});

async function matchSelected(matchKey: string) {
  await matchStore.selectMatch(matchKey);
}
</script>
