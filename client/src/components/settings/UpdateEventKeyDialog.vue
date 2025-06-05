<template>
  <VDialog v-model="show"
           transition="dialog-bottom-transition"
           max-width="900"
           :fullscreen="useFullscreenModal"
           @close="show = false"
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
        <VStepper
          :items="['Choose event', 'Confirm event name']"
        >
          <template v-slot:item.1>
            <VAlert v-if="!settingsStore.isFirstLoad && settingsStore.settings?.useFrcEventsApi" variant="tonal" color="info" icon="mdi-information-outline">
              Event key autocomplete is unavailable when using the FRC Events data source. Instead, enter the event key from FRC Events below.
            </VAlert>

            <VCombobox class="mt-4" :items="[{ eventName: '2024 PCH District Gainesville Event', eventKey: '2024gagai', featured: true, featuredReason: 'Current event'}, { eventName: '2024 PCH District Dalton Event', eventKey: '2024gadal', featured: true, featuredReason: 'Upcoming district event'}, { eventName: '2024 PCH District Riverdale Event', eventKey: '2024garvd'}]" item-title="eventKey" item-value="eventKey" label="Select event">
              <template v-slot:item="{ props: itemProps, item }">
                <VListItem v-bind="itemProps" :title="item.raw.eventName" :subtitle="`${item.raw.eventKey} | ${item.raw.featuredReason ?? ''}`" :prepend-icon="item.raw.featured ? 'mdi-star-outline' : 'mdi-calendar'">
                </VListItem>
              </template>
            </VCombobox>
          </template>

          <template v-slot:item.2>
            Confirm event name
          </template>
        </VStepper>
      </VCardText>
    </VCard>
  </VDialog>


</template>
<script lang="ts" setup>
import { useDisplay } from "vuetify";
import { computed } from "vue";
import { VCard } from "vuetify/components";
import { useSettingsStore } from "@/stores/settings";

const settingsStore = useSettingsStore();

const emit = defineEmits(["close"]);
const show = defineModel<boolean>({
  default: false,
})

const { smAndDown } = useDisplay()

const useFullscreenModal = computed(() => {
  return smAndDown.value;
})
</script>
