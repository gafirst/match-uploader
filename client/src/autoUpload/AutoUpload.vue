<template>
  <VCard
    class="mt-2 mb-2"
    variant="outlined"
    color="purple"
  >
    <VCardTitle>
      <VIcon
        icon="mdi-clock-fast"
        class="mr-2"
      />Auto upload <VChip>Beta</VChip>
    </VCardTitle>
    <VCardText style="color: initial">
      <BetaFeedback class="mb-2" />
      <p>Auto Upload is similar to Live Mode, except that it runs on the server.</p>
      <MatchAutocompleteDropdown v-if="!autoUploadStore.isEnabled" class="mt-6" label="Starting match" v-model="selectedMatch" />

      <VAlert color="info" variant="tonal" density="compact"
              v-if="!autoUploadStore.isEnabled">
        Use Auto Upload automatically upload the next match's videos once all required information and videos are available.
      </VAlert>

      <VAlert color="error" variant="tonal" density="compact" class="mb-4"
              v-if="!!autoUploadStore.changeStateError">
        {{ autoUploadStore.changeStateError }}
      </VAlert>

      <VAlert color="error" variant="tonal" density="compact"
              v-if="autoUploadStore.unmetPrereqs?.length">
        Auto Upload was not enabled. The following prerequisites are not satisfied:
        <VList style="background-color: initial">
          <TaskListItem
            v-for="requirement in autoUploadStore.unmetPrereqs"
            :key="requirement"
            :complete="false"
            density="compact"
          >
            {{ requirement }}
          </TaskListItem>
        </VList>

        Click Enable Auto Upload below to try again.
      </VAlert>

      <p class="mt-2 mb-2"><strong>Next match:</strong> Qualification 2</p>

      <strong>Recent runs</strong>
      <VDataTable
        no-data-text="No recent runs"
        :headers="[
          {
            title: 'Timestamp',
            value: 'timestamp'
          },
          {
            title: 'Match',
            value: 'match'
          },
          {
            title: 'Result',
            value: 'result'
          },

        ]"
        hide-default-footer
        :items="data"
        multi-sort
        :sort-by="[
      { key: 'timestamp', order: 'desc' },
    ]"
      >
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.timestamp="{ item }">
          {{ item.timestamp }}
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.result="{ item }">
          <VIcon color="success">mdi-check-circle</VIcon>
          <VIcon color="success">mdi-check-circle</VIcon>
        </template>


      </VDataTable>
      <VBtn
        class="mt-4"
        :disabled="!selectedMatch"
        :loading="autoUploadStore.changeStateLoading"
        v-if="!autoUploadStore.isEnabled"
        @click="autoUploadStore.enable(selectedMatch)"
      >Enable Auto Upload</VBtn>
      <VBtn
        class="mt-4"
        :loading="autoUploadStore.changeStateLoading"
        @click="autoUploadStore.disable()"
        v-else>
        Disable Auto Upload
      </VBtn>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import BetaFeedback from "@/components/util/BetaFeedback.vue";
import MatchAutocompleteDropdown from "@/components/matches/MatchAutocompleteDropdown.vue";
import { useAutoUploadStore } from "@/stores/autoUpload";
import { ref } from "vue";
import TaskListItem from "@/components/util/TaskListItem.vue";
import { useSettingsStore } from "@/stores/settings";

const selectedMatch = ref<string | null>(null);

const autoUploadStore = useAutoUploadStore();

const data = ref([
    {
      timestamp: "2024-01-01 12:00:00",
      match: "Qualification 2",
      result: "Uploaded 2 videos", // FIXME
    },
    {
      timestamp: "2024-01-01 12:05:00",
      match: "Qualification 3",
      status: "Pending"
    }
  ])
</script>



<style scoped>

</style>
