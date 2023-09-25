<template>
  <VAlert v-if="!settingsStore.youTubeAuthState?.accessTokenStored"
          color="warning"
          variant="tonal"
          text="To select a YouTube channel to upload to, complete YouTube setup steps in Settings."
  />
  <VAutocomplete v-else-if="data && data.channels"
                 v-model="matchStore.youTubeChannelId"
                 :items="data.channels"
                 rounded
                 auto-select-first
                 placeholder="Select a channel..."
                 variant="outlined"
                 label="YouTube channel"
                 item-title="title"
                 item-value="id"
                 class="mt-2"
                 @update:model-value="channelSelected"
  />
  <VAlert v-else-if="error"
          color="error"
          :text="error.message"
  />
  <VAlert v-else
          color="error"
          text="Error: Unable to render YouTube channel selection"
  />
</template>

<script lang="ts" setup>
import useSWRV from "swrv";
import {useMatchStore} from "@/stores/match";
import {useSettingsStore} from "@/stores/settings";


const { data, error } = useSWRV("/api/v1/youtube/status");

const matchStore = useMatchStore();
const settingsStore = useSettingsStore();

function channelSelected(channelId: string) {
  console.log(channelId);
  matchStore.youTubeChannelId = channelId;
}
</script>
