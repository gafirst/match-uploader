<template>
  <VDialog
    v-model="show"
    transition="dialog-bottom-transition"
    max-width="900"
    :fullscreen="useFullscreenModal"
    @after-leave="() => changeEventStore.reset()"
  >
    <VCard>
      <VToolbar color="primary">
        <VBtn
          icon="mdi-close"
          @click="show = false; $emit('close')"
        />
        <VToolbarTitle>Update event key</VToolbarTitle>
      </VToolbar>
      <VCardText>
        <VStepper v-model="changeEventStore.currentStep">
          <VStepperHeader>
            <VStepperItem
              title="Choose event"
              :value="changeEventsWizardSteps[0]"
            />
            <VStepperItem
              title="Confirm event name"
              :value="changeEventsWizardSteps[1]"
            />
            <VStepperItem
              title="Review and save"
              :value="changeEventsWizardSteps[2]"
            />
          </VStepperHeader>
          <VStepperWindow>
            <VStepperWindowItem
              :value="changeEventsWizardSteps[0]"
            >
              <VAlert
                v-if="missingTbaApiKey"
                variant="tonal"
                color="warning"
                icon="mdi-alert-circle-outline"
              >
                Exit this dialog and set a TBA read API key to enable event data autocompletion
              </VAlert>
              <VAlert
                v-else-if="!settingsStore.isFirstLoad && settingsStore.settings?.useFrcEventsApi"
                variant="tonal"
                color="warning"
                icon="mdi-alert-circle-outline"
              >
                Event key autocomplete is unavailable because the FRC Events API is being used
              </VAlert>

              <VTextField
                v-if="!settingsStore.isFirstLoad && settingsStore.settings?.useFrcEventsApi"
                v-model="changeEventStore.selectedEventRaw"
                class="mt-4"
                label="FRC Events event key"
              />
              <VCombobox
                v-else
                v-model="changeEventStore.selectedEventRaw"
                class="mt-4"
                :items="comboboxItems"
                label="Select event"
                autocomplete="off"
                hint="If your event isn't listed, enter the event key here"
                persistent-hint
                clearable
                :loading="changeEventStore.eventsAutocompleteLoading"
                :filter-keys="['title', 'value']"
              />
            </VStepperWindowItem>
            <VStepperWindowItem :value="changeEventsWizardSteps[1]">
              <p>Confirm event name:</p>
              <VTextField
                v-model="changeEventStore.newEventName"
                counter
                :rules="[rules.maxLength100]"
              />
            </VStepperWindowItem>
            <VStepperWindowItem :value="changeEventsWizardSteps[2]">
              <LoadingSpinner v-if="changeEventStore.sampleVideoTitlesLoading" />
              <VAlert
                v-else-if="!!changeEventStore.sampleVideoTitlesError"
                variant="tonal"
                color="error"
                density="compact"
                icon="mdi-alert-circle-outline"
              >
                {{ changeEventStore.sampleVideoTitlesError }}
              </VAlert>
              <VSheet v-else>
                <h3>Event code</h3>
                <p>{{ changeEventStore.selectedEventComputed }}</p>

                <h3 class="mt-2">
                  Event name
                </h3>
                <VAlert
                  v-if="!changeEventStore.sampleVideoTitles?.eventNameChecks?.passed"
                  class="mt-2 mb-2"
                  variant="tonal"
                  color="warning"
                  density="compact"
                  icon="mdi-alert-circle-outline"
                >
                  Check event name for typos
                </VAlert>
                <div class="d-flex flex-wrap word-flex-container">
                  <div
                    v-for="token in changeEventStore.sampleVideoTitles?.eventNameChecks.spellCheck"
                    :key="token.word"
                    :class="{ 'word-flex-token': true, 'font-weight-bold': !token.ok, 'text-red': !token.ok}"
                  >
                    {{ token.word }}&nbsp;
                  </div>
                </div>
                <div
                  v-if="!changeEventStore.sampleVideoTitles?.matchTitlesCheck.passed"
                >
                  <h3 class="mt-2">
                    Sample video titles
                  </h3>
                  <VAlert
                    class="mt-2 mb-2"
                    variant="tonal"
                    color="error"
                    density="compact"
                    icon="mdi-alert-circle-outline"
                  >
                    With this event name, some video titles will be too long to upload to YouTube
                  </VAlert>

                  <ul class="ml-5">
                    <li
                      v-for="entry in changeEventStore.sampleVideoTitlesLengthNotOk"
                      :key="entry.matchTitle"
                    >
                      <div class="">
                        <span class="">{{ entry.cutOffTitle }}</span>
                        <span class="font-weight-bold text-red">{{ entry.remainder }}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </VSheet>
            </VStepperWindowItem>
          </VStepperWindow>
          <VStepperActions
            @click:prev="changeEventStore.previousStep"
            @click:next="changeEventStore.advanceStep"
          >
            <template
              v-if="changeEventStore.currentStep === changeEventsWizardSteps[2]"
              #next
            >
              <VBtn
                :disabled="false"
                variant="elevated"
                color="primary"
                @click="saveChanges"
              >
                Save
                changes
              </VBtn>
            </template>
          </VStepperActions>
        </VStepper>
      </VCardText>
    </VCard>
  </VDialog>
</template>
<script lang="ts" setup>
import { useDisplay } from "vuetify";
import { computed, watch } from "vue";
import { VCard } from "vuetify/components";
import { useSettingsStore } from "@/stores/settings";
import { changeEventsWizardSteps, useChangeEventStore } from "@/stores/changeEventStore";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import duration from "dayjs/plugin/duration";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import LoadingSpinner from "@/components/util/LoadingSpinner.vue";

dayjs.extend(advancedFormat);
dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

const settingsStore = useSettingsStore();
const changeEventStore = useChangeEventStore();

const emit = defineEmits(["close"]);
const show = defineModel<boolean>({
  default: false,
});

const { smAndDown } = useDisplay();

const useFullscreenModal = computed(() => {
  return smAndDown.value;
});

const rules = {
  maxLength100: (value: unknown) =>
    (!!value && typeof value === "string" && value.length <= 100) || "Cannot be longer than 100 characters",
};

const comboboxItems = computed(() => {
  return changeEventStore.eventsAutocompleteItems.map(event => ({
    title: event.name,
    value: event.key,
    event: event,
    props: {
      prependIcon: event.icon,
      subtitle: `${event.reason} | ${dayjs(event.start_date).format("l")} - `
        + `${dayjs(event.end_date).format("l")} | ${event.key}`,
    },
  }));
});

watch(() => show.value, (newVal) => {
  if (newVal) {
    changeEventStore.getEventsAutocomplete();
  }
});

const missingTbaApiKey = computed(() => {
  if (settingsStore.isFirstLoad || settingsStore.settings?.useFrcEventsApi) {
    return false;
  }

  return !settingsStore.obfuscatedSecrets?.theBlueAllianceReadApiKey;
});

async function saveChanges() {
  if (await changeEventStore.saveChanges()) {
    show.value = false;
    emit("close");
    return;
  }

  show.value = false;
  emit("close");
}

</script>
<style scoped>
.word-flex-token {
  display: inline-block;
}

.word-flex-container {
  word-break: break-word;
}
</style>
