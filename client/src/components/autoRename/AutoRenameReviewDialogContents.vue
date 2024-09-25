<template>
  <VCard>
    <VToolbar>
      <VBtn icon="mdi-close" @click="$emit('close')" />
      <VToolbarTitle>Review association</VToolbarTitle>
      <VSpacer />
    </VToolbar>
    <VCardText>
      <VRow>
        <p>
          {{ associatedMatchKey }}
        </p>
      </VRow>
      <VRow>
        <VCol>
          <h2 class="mb-2">Video</h2>
          <video :src="`videos/${props.association.filePath}`"
                 controls
                 preload="metadata"
          />
        </VCol>
        <VCol>
          <h3>Association</h3>
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
                <MatchAutocompleteDropdown v-model="associatedMatchKey" />
              </span>
              <span v-else>{{ item.value }}</span>
            </template>
          </VDataTable>
        </VCol>
      </VRow>
    </VCardText>
    <VCardActions>
      <VSpacer />
      <VBtn color="error"
            :disabled="confirmLoading"
      >
        Ignore
      </VBtn>
      <VBtn color="success"
            variant="tonal"
            :loading="confirmLoading"
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

const emit = defineEmits(["close"]);

const props = defineProps<{
  association: AutoRenameAssociation;
}>();

const autoRenameStore = useAutoRenameStore();

const confirmLoading = ref(false);
// TODO: Implement confirmError
async function onConfirm() {
  confirmLoading.value = true;
  await autoRenameStore.confirmWeakAssociation(association.value, associatedMatchKey.value);
  confirmLoading.value = false;
  emit("close");
}

// TODO: Include match start time?
const columnOrder = [
  // "status",
  "match",
  "videoLabel",
  "statusReason",
  "videoTimestamp",
  "videoFile",
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
