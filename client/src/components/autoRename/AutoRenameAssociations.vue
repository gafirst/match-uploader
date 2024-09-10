<template>
  <VDataTable :items="autoRenameStore.associationsInStatus(includedAssociationStatuses)"
              :loading="autoRenameStore.loadingAssociations"
              :headers="[
                { title: 'Label', value: 'videoLabel' },
                { title: 'File', key: 'videoFileName', value: item => item.videoFile },
                { title: 'Match', value: 'matchKey' },
                { title: 'Status', value: 'status' },
                { title: 'Actions', key: 'actions'}
              ]"
  >
    <template v-slot:item.status="{ item }">
      <VChip :color="statusToColor(item.status)">{{ item.status }}</VChip>
    </template>

    <template v-slot:item.actions="{ item }">
      <div class="d-flex">
        <VBtn v-if="allowEdits(item)"
              class="mr-2"
              @click="selectedAssociation = item; showReviewDialog = true"
        >
          Review
        </VBtn>
        <VBtn v-if="allowEdits(item)"
              class="mr-2"
              color="error"
              variant="outlined"
        >
          Ignore
        </VBtn>
        <VBtn v-if="allowEdits(item) && item.status === AutoRenameAssociationStatus.WEAK"
              class="mr-2"
              color="success"
              @click="selectedAssociation = item; showReviewDialog = true"
        >
          Confirm
        </VBtn>
        <VBtn v-if="item.status === AutoRenameAssociationStatus.STRONG && !item.renameCompleted" color="error">
          Unmatch
        </VBtn>
        <VBtn v-else-if="item.status === AutoRenameAssociationStatus.STRONG && item.renameCompleted" color="error">
          Undo rename
        </VBtn>
      </div>
    </template>

    <template v-slot:item.videoFile="{ item }">
      <video :src="`videos/${item.filePath}`"
             controls
             preload="metadata"
             class="pa-3"
             style="max-width: 300px;"
      />
    </template>

    <template v-slot:item.matchKey="{ item }">
      {{ item.match ?? "None" }}<br />
      <span style="color: gray">{{ item.matchKey ?? "" }}</span>
    </template>
  </VDataTable>
  <VDialog v-model="showReviewDialog" max-width="500">
    <AutoRenameReviewDialogContents association="selectedAssociation" @close="showReviewDialog = false" />
  </VDialog>
</template>

<script lang="ts" setup>
import { useAutoRenameStore } from "@/stores/autoRename";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";
import { ref } from "vue";
import { isAutoRenameAssociation } from "@/types/autoRename/AutoRenameAssociation";
import AutoRenameReviewDialogContents from "@/components/autoRename/AutoRenameReviewDialogContents.vue";

const props = defineProps<{
  includedAssociationStatuses: AutoRenameAssociationStatus[];
}>();

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

const allowEdits = function(item: unknown) {
  if (!isAutoRenameAssociation(item)) {
    console.error("Invalid item passed to allowReview computed property", item);
    return false;
  }
  console.log(item);
  if (props.includedAssociationStatuses.includes(AutoRenameAssociationStatus.STRONG)) {
    console.log("Strong association, no review needed", item);
    return !item.renameCompleted;
  }

  return true;
};



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
