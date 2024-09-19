<template>
  <VRow>
    <VCol>
      <h2>Review required</h2>
      <VAlert v-if="autoRenameStore.associationsError"
              class="mt-2"
              variant="tonal"
              color="error"
      >
        {{ autoRenameStore.associationsError }}
      </VAlert>
      <AutoRenameAssociations :included-association-statuses="[
        AutoRenameAssociationStatus.WEAK,
        AutoRenameAssociationStatus.FAILED
      ]"
      />
      <h2>Recently associated</h2>
      <AutoRenameAssociations :included-association-statuses="[
        AutoRenameAssociationStatus.STRONG
      ]"
      />
    </VCol>
  </VRow>
</template>
<script lang="ts" setup>
import { useAutoRenameStore } from "@/stores/autoRename";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";
import { ref } from "vue";
import AutoRenameAssociations from "@/components/autoRename/AutoRenameAssociations.vue";

const autoRenameStore = useAutoRenameStore();
autoRenameStore.getAssociations();

const selectedAssociation = ref(null);
const showReviewDialog = ref(false);

function statusToColor(status: string) {
  switch (status) {
    case "STRONG":
      return "success";
    case "WEAK":
      return "warning";
    case "FAILED":
      return "error";
    default:
      return "grey";
  }
}
</script>
<style scoped>
/* https://css-tricks.com/fluid-width-video/ */
video {
  /* override other styles to make responsive */
  width: 100% !important;
  height: auto !important;
}

.association-card {
  max-width: 30%;
  min-height: 500px;
}
</style>
