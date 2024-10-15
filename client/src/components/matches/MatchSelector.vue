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
              color="error"
              variant="tonal"
              class="mb-2"
      >
        {{ matchStore.nextMatchError }}
      </VAlert>
      <!--
      Note: this component may be laggy when running in development, but in production builds the performance
      should become significantly better.
      -->
      <VAutocomplete v-model="matchStore.selectedMatchKey"
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
      <VBtn v-if="shouldShowNextMatchBtn"
            :variant="!matchStore.allMatchVideosQueued ? 'outlined' : undefined"
            :disabled="matchStore.uploadInProgress"
            :loading="matchStore.nextMatchLoading"
            prepend-icon="mdi-skip-next"
            class="mb-2"
            @click="matchStore.advanceMatch"
      >
        Next match
      </VBtn>

      <VAlert v-else-if="shouldShowNextMatchBtnUnavailableError"
              color="warning"
              variant="tonal"
              class="mt-2"
      >
        <p class="mb-2">
          The Next Match button is unavailable because the playoffs type is not set to double elimination.
        </p>
        <p>
          If this is unintentional, update the playoffs type in
          <RouterLink to="/settings">Settings</RouterLink>.
        </p>
      </VAlert>
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import {useMatchStore} from "@/stores/match";
import {useMatchListStore} from "@/stores/matchList";
import { computed, onMounted } from "vue";
import FrcEventsWarning from "@/components/alerts/FrcEventsWarning.vue";
import {useSettingsStore} from "@/stores/settings";
import MatchDataAttribution from "@/components/matches/MatchDataAttribution.vue";
import { PLAYOFF_DOUBLE_ELIM } from "@/types/MatchType";

const matchStore = useMatchStore();
const matchListStore = useMatchListStore();
const settingsStore = useSettingsStore();

onMounted(() => {
  matchListStore.getMatchList();
});

const shouldShowNextMatchBtn = computed(
  () => matchStore.selectedMatchKey &&
    (settingsStore.isFirstLoad || settingsStore.settings?.playoffsType === PLAYOFF_DOUBLE_ELIM),
);

const shouldShowNextMatchBtnUnavailableError = computed(
  () => !settingsStore.isFirstLoad
    && settingsStore.settings?.playoffsType !== PLAYOFF_DOUBLE_ELIM
    && matchStore.selectedMatchKey,
);

async function matchSelected(matchKey: string) {
  await matchStore.selectMatch(matchKey);
}
</script>
