<template>
  <v-autocomplete :items="matches"
                  rounded
                  auto-select-first
                  placeholder="Select a match..."
                  variant="outlined"
                  label="Match"
                  item-title="title"
                  item-value="matchKey"
                  @update:model-value="$emit('matchSelected', $event)"
  />
</template>

<script lang="ts" setup>
import {ref} from "vue";


const matches = ref([
  {
    title: "Qualification 1",
    matchKey: "2023gacar_qm1",
  },
  {
    title: "Qualification 2",
    matchKey: "2023gacar_qm2",
  },
  {
    title: "Qualification 3",
    matchKey: "2023gacar_qm3",
  },
  {
    title: "Qualification 4",
    matchKey: "2023gacar_qm4",
  },
  {
    title: "Qualification 5",
    matchKey: "2023gacar_qm5",
  },
]);

const selectedMatch = ref<string | null>(null);

defineEmits<{
  matchSelected: [matchId: string],
}>();
</script>
