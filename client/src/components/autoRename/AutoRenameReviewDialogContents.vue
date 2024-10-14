<template>
  <VCard>
    <VToolbar :color="autoRenameAssociationStatusToColor(association.status)">
      <VBtn icon="mdi-close" @click="$emit('close')" />
      <VToolbarTitle>Review {{ autoRenameAssociationStatusToUiString(association.status) }} association</VToolbarTitle>
      <VSpacer />
    </VToolbar>
    <VCardText>
      <VRow>
        <VCol>
          <h2 class="mb-2">Video</h2>
          <video :src="videoFilePath"
                 controls
                 preload="metadata"
          />
        </VCol>
        <VCol>
          <h2>Association</h2>
          <VAlert v-if="renameComplete"
                  variant="tonal"
                  color="success"
                  icon="mdi-lock"
                  density="compact"
                  class="mb-2"
                  title="File rename completed"
          >
            To make edits, close this dialog and click <strong>Undo Rename</strong> to attempt to revert the rename.
            Note the file might have already been uploaded.
          </VAlert>

          <VAlert v-if="association.renameJobId &&
                    (workerStore.jobHasStatus(association.renameJobId, WorkerJobStatus.PENDING))"
                  variant="tonal"
                  color="info"
                  icon="mdi-clock-outline"
                  density="compact"
                  class="mb-2"
                  title="File rename pending"
          >
            Job #{{ association.renameJobId }} will start after {{ dayjs(association.renameAfter).format("llll z") }}
          </VAlert>

          <VAlert v-if="association.renameJobId &&
                    workerStore.jobHasStatus(association.renameJobId, WorkerJobStatus.STARTED)"
                  variant="tonal"
                  color="info"
                  icon="mdi-clock-outline"
                  density="compact"
                  class="mb-2"
          >
            File rename in progress: Job #{{ association.renameJobId }}
          </VAlert>

          <VAlert v-if="association.renameJobId &&
                    workerStore.jobHasStatus(association.renameJobId, WorkerJobStatus.FAILED)"
                  variant="tonal"
                  color="error"
                  icon="mdi-alert-circle"
                  density="compact"
                  class="mb-2"
                  title="File rename failed"
          >
            Job #{{ association.renameJobId }} failed:
            {{ workerStore.jobs.get(association.renameJobId)?.error ?? "Unknown error" }}
          </VAlert>

          <VAlert v-if="association.status === AutoRenameAssociationStatus.FAILED"
                  variant="tonal"
                  color="error"
                  icon="mdi-alert-circle"
                  density="compact"
                  class="mb-2"
          >
            Automated association failed: {{ association.statusReason }}
          </VAlert>
          <VAlert v-if="!renameComplete && association.orderingIssueMatchKey
                    && association.orderingIssueMatchKey === association.matchKey"
                  variant="tonal"
                  color="warning"
                  icon="mdi-content-duplicate"
                  density="compact"
                  class="mb-2"
                  title="Possible duplicate video"
          >
            {{ association.orderingIssueMatchName ?? orderingIssueMatchKey }} has already been associated to a video
            for this label
          </VAlert>
          <VAlert v-else-if="!renameComplete && association.orderingIssueMatchKey &&
                    association.orderingIssueMatchKey !== association.matchKey"
                  variant="tonal"
                  color="warning"
                  icon="mdi-alert-circle"
                  density="compact"
                  class="mb-2"
                  title="Is this association correct?"
          >
            A later match
            ({{ association.orderingIssueMatchName ?? orderingIssueMatchKey }}) has already been associated to a video
            for this label
          </VAlert>
          <VAlert v-if="association.startTimeDiffAbnormal"
                  variant="tonal"
                  color="warning"
                  icon="mdi-alert-circle"
                  density="compact"
                  class="mb-2"
          >
            Selected match may be inaccurate
          </VAlert>
          <VAlert v-if="association.videoDurationAbnormal"
                  variant="tonal"
                  color="warning"
                  icon="mdi-alert-circle"
                  density="compact"
                  class="mb-2"
          >
            Video duration is outside the expected range
          </VAlert>
          <VAlert v-if="association.status === AutoRenameAssociationStatus.UNMATCHED"
                  variant="tonal"
                  color="info"
                  icon="mdi-information"
                  density="compact"
                  class="mb-2"
          >
            Automatic association pending:
            {{ association.associationAttempts }}/{{ association.maxAssociationAttempts }} attempts made
          </VAlert>

          <VDataTable :headers="[
                        { title: 'Key', value: 'key', align: 'end' },
                        { title: 'Value', value: 'value' },
                      ]"
                      :items="associationAsEntries"
                      hide-default-header
                      hide-default-footer
          >
            <template v-slot:item.value="{ item }">
              <span v-if="item.key.toLowerCase() === 'match'">
                <MatchAutocompleteDropdown v-if="isEditable"
                                           v-model="associatedMatchKey"
                />
                <!-- TODO: Extract non-editable state into component -->
                <template v-else>
                  {{ association.matchName ?? "None" }}<br />
                  <span style="color: gray">{{ association.matchKey ?? "" }}</span>
                </template>
              </span>
              <span v-else-if="item.key.toLowerCase() === 'video start time'">
                {{ dayjs(item.value).format("llll z") }}
              </span>
              <span v-else-if="item.key.toLowerCase() === 'start time difference'">
                <template v-if="item.value === null">
                  Unknown
                </template>
                <VChip v-else
                       :color="startTimeDiffColor"
                >
                  {{ renderDuration(item.value) }}
                </VChip>
              </span>
              <span v-else-if="item.key.toLowerCase() === 'video duration'">
                <template v-if="item.value === null">
                  Unknown
                </template>
                <VChip v-else
                       :color="videoDurationColor"
                >
                  {{ renderDuration(item.value) }}
                </VChip>
              </span>
              <span v-else>{{ item.value }}</span>
            </template>
          </VDataTable>
          <VAlert v-if="noMatchSelected"
                  variant="tonal"
                  density="compact"
                  color="error"
                  icon="mdi-alert-circle"
          >
            To accept this association, select a match above.
          </VAlert>
        </VCol>
      </VRow>
    </VCardText>
    <VCardActions v-if="isEditable">
      <VSpacer />
      <VBtn color="error"
            :disabled="autoRenameStore.confirmWeakAssociationLoading || autoRenameStore.ignoreAssociationLoading"
            :loading="autoRenameStore.ignoreAssociationLoading"
            @click="onIgnore"
      >
        Ignore
      </VBtn>
      <VBtn color="success"
            variant="tonal"
            :loading="autoRenameStore.confirmWeakAssociationLoading"
            :disabled="autoRenameStore.confirmWeakAssociationLoading || autoRenameStore.ignoreAssociationLoading
              || noMatchSelected"
            @click="onConfirm"
      >
        Accept
      </VBtn>
    </VCardActions>
  </VCard>
</template>
<script lang="ts" setup>
import { computed, reactive, ref, toRef } from "vue";
import { capitalizeFirstLetter } from "@/util/capitalize";
import { useAutoRenameStore } from "@/stores/autoRename";
import MatchAutocompleteDropdown from "@/components/matches/MatchAutocompleteDropdown.vue";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import duration from "dayjs/plugin/duration";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  AutoRenameAssociationStatus,
  autoRenameAssociationStatusToColor,
  autoRenameAssociationStatusToUiString,
} from "@/types/autoRename/AutoRenameAssociationStatus";
import { useWorkerStore } from "@/stores/worker";
import { WorkerJobStatus } from "@/types/WorkerJob";

dayjs.extend(advancedFormat);
dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

const workerStore = useWorkerStore();
workerStore.loadJobs();

const emit = defineEmits(["close"]);

const props = defineProps<{
  associationFilePath: string;
}>();

const autoRenameStore = useAutoRenameStore();

async function onConfirm() {
  await autoRenameStore.confirmWeakAssociation(association.value, associatedMatchKey.value);
  emit("close");
}

async function onIgnore() {
  await autoRenameStore.ignoreAssociation(association.value);
  emit("close");
}

const columnOrder = [
  "matchKey",
  "videoFile",
  "videoTimestamp",
  "videoLabel",
  "startTimeDiffSecs",
  "videoDurationSecs",
];

const prettyColumnNames = {
  videoLabel: "label",
  videoFile: "file name",
  matchKey: "match",
  videoTimestamp: "video start time",
  associationAttempts: "association attempts",
  maxAssociationAttempts: "max association attempts",
  startTimeDiffSecs: "Start time difference",
  videoDurationSecs: "Video duration",
};

const filePath = toRef(props, "associationFilePath");
const association = computed(() => {
  return autoRenameStore.associationsMap.get(filePath.value);
});
const associatedMatchKey = ref(autoRenameStore.associationsMap.get(filePath.value).matchKey);

const associationAsEntries = Object.entries(association.value)
      .filter(([key]) => columnOrder.includes(key))
      .sort(([key1], [key2]) => columnOrder.indexOf(key1) - columnOrder.indexOf(key2))
      .map(([key, value]) => {
        return {
          key: capitalizeFirstLetter(prettyColumnNames[key]) ?? key,
          value,
        };
});

const renderDuration = (seconds: unknown) => {
  if (typeof seconds !== "number") {
    console.warn(`renderDuration: input type is not a number: ${seconds} (type: ${typeof seconds})`);
    return "";
  }
  const duration = dayjs.duration(seconds, "seconds");
  if (duration.asHours() >= 1) {
    return `${duration.format("H:mm:ss")} hr${duration.asHours() !== 1 ? "s" : ""}`;
  }
  if (duration.asMinutes() >= 1) {
    return `${duration.format("m:ss")} min${duration.asMinutes() !== 1 ? "s" : ""}`;
  }
  return `${duration.format("s")} sec${duration.asSeconds() !== 1 ? "s" : ""}`;
};

const videoDurationColor = computed(() => {
  if (association.value.videoDurationAbnormal) {
    return "warning";
  }

  return "success";
});

const startTimeDiffColor = computed(() => {
  if (association.value.startTimeDiffAbnormal) {
    return "warning";
  }

  return "success";
});

const videoFilePath = computed(() => {
  const prefix = "videos/";

  if (!association.value) {
    return "";
  }

  if (association.value.renameCompleted) {
    return `${prefix}${association.value.videoLabel}/${association.value.newFileName}`;
  }

  return `${prefix}${association.value.filePath}`;
});

const isEditable = computed(() => {
  return autoRenameStore.isEditable(association.value);
});

const renameComplete = computed(() => {
  return association.value.renameJobId &&
    (workerStore.jobHasStatus(association.value.renameJobId, WorkerJobStatus.COMPLETED))
    || association.value.renameCompleted;
});

const noMatchSelected = computed(() => {
  return !associatedMatchKey.value;
});

</script>
<style scoped>
.video-preview {
  max-width: 12.25rem;
}

/* https://css-tricks.com/fluid-width-video/ */
video {
  /* override other styles to make responsive */
  width: 100% !important;
  height: auto !important;
}
</style>
