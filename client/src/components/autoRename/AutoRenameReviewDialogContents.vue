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
          <video :src="`videos/${props.association.filePath}`"
                 controls
                 preload="metadata"
          />
        </VCol>
        <VCol>
          <h2>Association</h2>

          <VAlert v-if="association.status === AutoRenameAssociationStatus.FAILED"
                  variant="tonal"
                  color="error"
                  icon="mdi-alert-circle"
                  density="compact"
                  class="mb-2"
          >
            Automated association failed: {{ association.statusReason }}
          </VAlert>
          <VAlert v-if="association.startTimeDiffAbnormal"
                  variant="tonal"
                  color="warning"
                  icon="mdi-alert-circle"
                  density="compact"
          >
            Selected match may be inaccurate
          </VAlert>
          <VAlert v-if="association.videoDurationAbnormal"
                  variant="tonal"
                  color="warning"
                  icon="mdi-alert-circle"
                  density="compact"
          >
            Video duration is outside the expected range
          </VAlert>
          <VDataTable :headers="[
                        { title: 'Key', value: 'key', align: 'end' },
                        { title: 'Value', value: 'value' },
                      ]"
                      :items="associationAsEntries"
                      hide-default-header
                      hide-default-footer
          >
            <!--            TODO: Edge case: Association becomes renamed (and locked for edits?) while the dialog is open -->
            <template v-slot:item.value="{ item }">
              <span v-if="item.key.toLowerCase() === 'match'">
                <!--                FIXME: This doesn't appear sometimes. Example case is accepting a weak association, not refreshing > clicking Review on the Strong association-->
                <MatchAutocompleteDropdown v-model="associatedMatchKey" />
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
              <VChip v-else-if="item.key.toLowerCase() === 'video duration'" :color="videoDurationColor">
                {{ renderDuration(item.value) }}
              </VChip>
              <span v-else>{{ item.value }}</span>
            </template>
          </VDataTable>
        </VCol>
      </VRow>
    </VCardText>
    <VCardActions>
      <VSpacer />
      <VBtn color="error"
            :disabled="confirmLoading || ignoreLoading"
            :loading="ignoreLoading"
            @click="onIgnore"
      >
        Ignore
      </VBtn>
      <VBtn color="success"
            variant="tonal"
            :loading="confirmLoading || ignoreLoading"
            @click="onConfirm"
      >
        Accept
      </VBtn>
    </VCardActions>
  </VCard>
</template>
<script lang="ts" setup>
import { AutoRenameAssociation } from "@/types/autoRename/AutoRenameAssociation";
import { computed, ref, toRef } from "vue";
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
  AutoRenameAssociationStatus, autoRenameAssociationStatusToColor,
  autoRenameAssociationStatusToUiString,
} from "@/types/autoRename/AutoRenameAssociationStatus";

dayjs.extend(advancedFormat);
dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

const emit = defineEmits(["close"]);

const props = defineProps<{
  association: AutoRenameAssociation;
}>();

const autoRenameStore = useAutoRenameStore();

const confirmLoading = ref(false);
// TODO: Implement confirmError and ignoreError

async function onConfirm() {
  confirmLoading.value = true;
  await autoRenameStore.confirmWeakAssociation(association.value, associatedMatchKey.value);
  confirmLoading.value = false;
  emit("close");
}

const ignoreLoading = ref(false);
async function onIgnore() {
  ignoreLoading.value = true;
  await autoRenameStore.ignoreAssociation(association.value);
  ignoreLoading.value = false;
  emit("close");
}

// TODO: Include match start time?
const columnOrder = [
  // "status",
  "match",
  "videoFile",
  "videoTimestamp",
  "videoLabel",
  "startTimeDiffSecs",
  "videoDurationSecs",
];

const prettyColumnNames = {
  videoLabel: "label",
  videoFile: "file name",
  status: "status",
  match: "match",
  statusReason: "review reason",
  videoTimestamp: "video start time",
  associationAttempts : "association attempts",
  maxAssociationAttempts: "max association attempts",
  startTimeDiffSecs: "Start time difference",
  videoDurationSecs: "Video duration",
};

const association = toRef(props, "association");
const associatedMatchKey = ref(association.value.matchKey);

const associationAsEntries = computed(() => Object.entries(props.association)
  .filter(([key]) => columnOrder.includes(key))
  .sort(([key1], [key2]) => columnOrder.indexOf(key1) - columnOrder.indexOf(key2))
  .map(([key, value]) => {
    return {
      key: capitalizeFirstLetter(prettyColumnNames[key]) ?? key,
      value,
    };
  }),
);

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
