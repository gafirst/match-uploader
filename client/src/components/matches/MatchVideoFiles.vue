<template>
  <div v-if="matchStore.selectedMatchKey">
    <VProgressCircular v-if="matchStore.matchVideosLoading"
                       indeterminate
                       class="mb-2"
    />
    <div v-else-if="matchStore.matchVideos.length">
      <VList>
        <VListItem v-for="file in matchStore.matchVideos"
                   :key="file.path"
                   :title="file.path"
                   :subtitle="file.videoLabel ? `Label: ${file.videoLabel}`: 'Unlabeled'"
        />
      </VList>
      <VBtn prepend-icon="mdi-refresh"
            variant="outlined"
            class="mb-2"
            @click="matchStore.getMatchVideos()"
      >
        Refresh
      </VBtn>
    </div>
    <VAlert v-else
            class="mb-2"
            color="warning"
    >
      No video files found.
    </VAlert>
  </div>
  <p v-else class="mb-2">No match selected</p>
  <VExpansionPanels>
    <NameMatchVideoFilesHelp />
    <MissingMatchVideosHelp />
  </VExpansionPanels>
</template>
<script lang="ts" setup>
import {useMatchStore} from "@/stores/match";
import NameMatchVideoFilesHelp from "@/components/help/NameMatchVideoFilesHelp.vue";
import MissingMatchVideosHelp from "@/components/help/MissingMatchVideosHelp.vue";

const matchStore = useMatchStore();

</script>
