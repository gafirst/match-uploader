<template>
  <h2>Review required</h2>
  <VAlert v-if="autoRenameStore.associationsError"
          class="mt-2"
          variant="tonal"
          color="error"
  >
    {{ autoRenameStore.associationsError }}
  </VAlert>
  <VDataTable :items="autoRenameStore.associationsInStatus([AutoRenameAssociationStatus.WEAK, AutoRenameAssociationStatus.FAILED])"
              :loading="autoRenameStore.loadingAssociations"
              :headers="[
                { title: 'Label', value: 'videoLabel' },
                { title: 'File', key: 'videoFileName', value: item => item.videoFile },
                // { title: 'Video', key: 'videoFile' },
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
        <VBtn class="mr-2" @click="selectedAssociation = item; showReviewDialog = true">Review</VBtn>
        <VBtn class="mr-2"
              color="error"
              variant="outlined"
        >
          Ignore
        </VBtn>
        <VBtn v-if="item.status === AutoRenameAssociationStatus.WEAK"
              class="mr-2"
              color="success"
              @click="selectedAssociation = item; showReviewDialog = true"
        >
          Confirm
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
    <VCard>
      <VCardTitle>Review association</VCardTitle>
      <VCardText>
        <p>Video: {{ selectedAssociation?.videoFileName }}</p>
        <p>Match: {{ selectedAssociation?.matchKey }}</p>
        <p>Status: {{ selectedAssociation?.status }}</p>
        <p>Label: {{ selectedAssociation?.videoLabel }}</p>
        <p>File: {{ selectedAssociation?.videoFile }}</p>
      </VCardText>
      <VCardActions>
        <VBtn @click="showReviewDialog = false">Close</VBtn>
      </VCardActions>
    </VCard>
  </vdialog>
</template>

<script lang="ts" setup>
import { useAutoRenameStore } from "@/stores/autoRename";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";
import { ref } from "vue";

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
