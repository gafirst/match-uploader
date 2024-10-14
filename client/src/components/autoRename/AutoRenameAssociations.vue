<template>
  <VDataTable :items="autoRenameStore.associationsInStatus(includedAssociationStatuses)"
              :loading="autoRenameStore.loadingAssociations"
              no-data-text="No associations found"
              :headers="[
                { title: 'Label', value: 'videoLabel' },
                { title: 'Date', value: 'videoTimestamp'},
                // TODO: Change videoFile -> videoFileName everywhere?
                { title: 'File', key: 'videoFileName', value: item => item.videoFile },
                { title: 'Match', value: 'matchKey' },
                { title: 'Status', value: 'status' },
                { title: 'Actions', key: 'actions'}
              ]"
              multi-sort
              :sort-by="[{ key: 'videoLabel', order: 'asc' }, { key: 'videoTimestamp', order: 'asc' }]"
  >
    <template v-slot:item.status="{ item }">
      <VChip :color="statusToColor(item.status)">{{ statusIncludingRenames(item) }}</VChip>
    </template>

    <template v-slot:item.actions="{ item }">
      <VAlert v-if="item.renameJobId &&
                workerStore.jobHasStatus(item.renameJobId, WorkerJobStatus.FAILED)"
              variant="tonal"
              color="error"
              icon="mdi-alert-circle"
              density="compact"
              class="mt-2 mb-2"
      >
        File rename failed. Click Review for details.
      </VAlert>
      <div class="d-flex mt-2 mb-2">
        <VBtn class="mr-2"
              @click="selectedAssociation = item; showReviewDialog = true"
        >
          {{ allowEdits(item) ? "Review" : "View" }}
        </VBtn>
        <VBtn v-if="item.renameJobId && !item.renameCompleted"
              color="error"
              :loading="autoRenameStore.undoRenameLoading"
              @click="() => undoRename(item)"
        >
          Cancel rename
        </VBtn>
        <VBtn v-if="item.renameJobId && item.renameCompleted"
              color="error"
              :loading="autoRenameStore.undoRenameLoading"
              @click="() => undoRename(item)"
        >
          Undo rename
        </VBtn>
        <VBtn v-if="[AutoRenameAssociationStatus.FAILED, AutoRenameAssociationStatus.WEAK].includes(item.status)"
              color="error"
              :loading="autoRenameStore.ignoreAssociationLoading"
              @click="() => ignoreAssociation(item)"
        >
          Ignore
        </VBtn>
      </div>
    </template>

    <template v-slot:item.videoTimestamp="{ item }">
      {{ dayjs(item.videoTimestamp).format("llll z") }}
    </template>

    <template v-slot:item.matchKey="{ item }">
      {{ item.matchName ?? "None" }}<br />
      <span style="color: gray">{{ item.matchKey ?? "" }}</span>
    </template>
  </VDataTable>
  <!--  TODO: Use this + useDisplay() to add mobile support later-->
  <!--  <VDialog v-model="showReviewDialog"-->
  <!--           max-width="500"-->
  <!--           transition="dialog-bottom-transition"-->
  <!--           :fullscreen="true"-->
  <!--  >-->
  <VDialog v-model="showReviewDialog"
           max-width="1000"
  >
    <AutoRenameReviewDialogContents :association-file-path="selectedAssociation.filePath"
                                    @close="showReviewDialog = false"
    />
  </VDialog>
</template>

<script lang="ts" setup>
import { useAutoRenameStore } from "@/stores/autoRename";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";
import { ref } from "vue";
import { isAutoRenameAssociation } from "@/types/autoRename/AutoRenameAssociation";
import AutoRenameReviewDialogContents from "@/components/autoRename/AutoRenameReviewDialogContents.vue";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import duration from "dayjs/plugin/duration";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useWorkerStore } from "@/stores/worker";
import { WorkerJobStatus } from "@/types/WorkerJob";
dayjs.extend(advancedFormat);
dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

const props = defineProps<{
  includedAssociationStatuses: AutoRenameAssociationStatus[];
}>();


const autoRenameStore = useAutoRenameStore();
autoRenameStore.getAssociations();

const workerStore = useWorkerStore();
workerStore.loadJobs();

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
    case "UNMATCHED":
      return "purple";
    default:
      return "grey";
  }
}

const allowEdits = function (item: unknown) {
  if (!isAutoRenameAssociation(item)) {
    console.error("Invalid item passed to allowReview computed property", item);
    return false;
  }

  return autoRenameStore.isEditable(item);
};

async function undoRename(item: unknown) {
  if (!isAutoRenameAssociation(item)) {
    console.error("Invalid item passed to undoRename function", item);
    return;
  }
  await autoRenameStore.undoRename(item);
}

async function ignoreAssociation(item: unknown) {
  if (!isAutoRenameAssociation(item)) {
    console.error("Invalid item passed to ignoreAssociation function", item);
    return;
  }
  await autoRenameStore.ignoreAssociation(item);
}

function statusIncludingRenames(item: unknown) {
  if (!isAutoRenameAssociation(item)) {
    console.error("Invalid item passed to ignoreAssociation function", item);
    return;
  }

  if (item.renameJobId) {
    if (item.renameCompleted || workerStore.jobHasStatus(item.renameJobId, WorkerJobStatus.COMPLETED)) {
      return "RENAMED";
    }
  }

  return item.status;
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
