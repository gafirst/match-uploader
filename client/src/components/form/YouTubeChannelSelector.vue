<template>
  <v-autocomplete v-if="data && data.channels"
                  :items="data.channels"
                  rounded
                  auto-select-first
                  placeholder="Select a channel..."
                  variant="outlined"
                  label="YouTube channel"
                  item-title="title"
                  item-value="id"
                  @update:model-value="$emit('channelSelected', $event)"
  />
</template>

<script lang="ts" setup>
import {ref} from "vue";
import useSWRV from "swrv";


const { data, error } = useSWRV("/api/v1/youtube/status");

defineEmits<{
  channelSelected: [channelId: string],
}>();
</script>
