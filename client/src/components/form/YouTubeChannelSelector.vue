<template>
  <v-autocomplete v-if="data && data.channels"
                  v-model="matchStore.youTubeChannelId"
                  :items="data.channels"
                  rounded
                  auto-select-first
                  placeholder="Select a channel..."
                  variant="outlined"
                  label="YouTube channel"
                  item-title="title"
                  item-value="id"
                  @update:model-value="channelSelected"
  />
</template>

<script lang="ts" setup>
import useSWRV from "swrv";
import {useMatchStore} from "@/stores/match";


const { data, error } = useSWRV("/api/v1/youtube/status");

const matchStore = useMatchStore();

function channelSelected(channelId: string) {
  console.log(channelId);
  matchStore.youTubeChannelId = channelId;
}
</script>
