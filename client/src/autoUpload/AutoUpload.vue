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
              v-if="!!autoUploadStore.enableError">
        {{ autoUploadStore.enableError }}
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
      <VBtn
        class="mt-4"
        :disabled="!selectedMatch || autoUploadStore.enableLoading"
        :loading="autoUploadStore.enableLoading"
        v-if="!autoUploadStore.isEnabled"
        @click="autoUploadStore.enable(selectedMatch)"
      >Enable Auto Upload</VBtn>
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
</script>



<style scoped>

</style>
