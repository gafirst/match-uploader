<template>
  <VRow>
    <VCol>
      <h1>
        Auto rename <VChip color="purple">
          Beta
        </VChip>
      </h1>
      <VAlert
        color="purple"
        variant="tonal"
        class="mb-4"
        density="compact"
        icon="mdi-bug-outline"
      >
        Report bugs and send feedback
        <a
          target="_blank"
          href="https://github.com/gafirst/match-uploader/issues/new/choose"
        >on GitHub</a>.
      </VAlert>

      <VAlert density="compact" color="success" icon="mdi-check-circle"
              variant="tonal" v-if="autoRenameStore.triggerNowSuccess"
              class="mb-4">
        Auto rename run scheduled and should begin shortly
      </VAlert>
      <VAlert density="compact" color="error" icon="mdi-alert-circle"
              variant="tonal" v-if="!!autoRenameStore.triggerNowError"
              class="mb-4">
        {{ autoRenameStore.triggerNowError }}
      </VAlert>

      <p class="mb-1">
        Enable auto rename
      </p>
      <AutosavingBtnSelectGroup
        :choices="['On', 'Off']"
        class="mb-2"
        :default-value="settingsStore.settings?.autoRenameEnabled ? 'On' : 'Off'"
        :loading="savingAutoRenameEnabled"
        @on-choice-selected="saveAutoRenameEnabled"
      />

      <VBtn class="mb-2" variant="outlined" prepend-icon="mdi-refresh"
            v-if="settingsStore.settings?.autoRenameEnabled"
            @click="autoRenameStore.triggerNow"
            :loading="autoRenameStore.triggerNowLoading"
      >Trigger now</VBtn>

      <VAlert
        v-if="autoRenameStore.confirmWeakAssociationError"
        class="mb-2"
        variant="tonal"
        color="error"
      >
        Confirm weak association failed: {{ autoRenameStore.confirmWeakAssociationError }}
      </VAlert>
      <VAlert
        v-if="autoRenameStore.undoRenameError"
        class="mb-2"
        variant="tonal"
        color="error"
      >
        Undo rename failed: {{ autoRenameStore.undoRenameError }}
      </VAlert>
      <VAlert
        v-if="autoRenameStore.ignoreAssociationError"
        class="mb-2"
        variant="tonal"
        color="error"
      >
        Ignore association failed: {{ autoRenameStore.ignoreAssociationError }}
      </VAlert>

      <h2>Review required</h2>
      <VAlert
        v-if="autoRenameStore.associationsError"
        class="mt-2"
        variant="tonal"
        color="error"
      >
        {{ autoRenameStore.associationsError }}
      </VAlert>
      <AutoRenameAssociations
        :included-association-statuses="[
          AutoRenameAssociationStatus.WEAK,
          AutoRenameAssociationStatus.FAILED,
        ]"
      />
      <h2>Recently associated</h2>
      <AutoRenameAssociations
        :included-association-statuses="[
          AutoRenameAssociationStatus.STRONG,
        ]"
      />
      <h2>Unmatched</h2>
      <AutoRenameAssociations
        :included-association-statuses="[
          AutoRenameAssociationStatus.UNMATCHED,
        ]"
      />
      <h2>Ignored</h2>
      <AutoRenameAssociations
        :included-association-statuses="[
          AutoRenameAssociationStatus.IGNORED,
        ]"
      />
    </VCol>
  </VRow>
</template>
<script lang="ts" setup>
import { useAutoRenameStore } from "@/stores/autoRename";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";
import AutoRenameAssociations from "@/components/autoRename/AutoRenameAssociations.vue";
import { useSettingsStore } from "@/stores/settings";
import AutosavingBtnSelectGroup from "@/components/form/AutosavingBtnSelectGroup.vue";
import { ref } from "vue";

const autoRenameStore = useAutoRenameStore();
autoRenameStore.getAssociations();

const settingsStore = useSettingsStore();

// TODO: Move into its own component
const savingAutoRenameEnabled = ref(false);

async function saveAutoRenameEnabled(value: string): Promise<void> {
  savingAutoRenameEnabled.value = true;
  await settingsStore.saveSetting("autoRenameEnabled", value.toLowerCase() === "on", "setting");
  await settingsStore.getSettings(false);
  savingAutoRenameEnabled.value = false;
  if (value.toLowerCase() === "on") {
    await autoRenameStore.triggerNow();
  } else if (!autoRenameStore.triggerNowLoading) {
    autoRenameStore.triggerNowSuccess = false;
    autoRenameStore.triggerNowError = "";
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
