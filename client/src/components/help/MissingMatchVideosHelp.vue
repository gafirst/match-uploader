<template>
  <!--  Make sure to use this component within Vuetify's VExpansionPanels component-->
  <VExpansionPanel>
    <VExpansionPanelTitle>
      Missing video files
    </VExpansionPanelTitle>
    <VExpansionPanelText>
      <ol class="ml-4">
        <li>
          Ensure your video files are named correctly (review <strong>How to name match video files</strong>).
        </li>
        <li>
          Check the Replay metadata setting
          <span v-if="matchStore.selectedMatchKey">(current value: {{ matchStore.isReplay ? "on" : "off" }})</span>.
          When the Replay setting is on, only video files for the replay of the match are returned. Replayed videos
          should generally be named like <code>Qualification 1 Replay.ext</code>. For full details, see
          <strong>How to name match video files</strong>.
        </li>
      </ol>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>
<script lang="ts" setup>
import { useMatchStore } from "@/stores/match";

const matchStore = useMatchStore();
</script>
