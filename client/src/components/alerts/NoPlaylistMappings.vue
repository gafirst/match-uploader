<template>
  <VAlert
    v-if="!playlistsStore.playlistMappingsExist"
    color="info"
    variant="tonal"
    density="comfortable"
    :rounded="props.rounded ?? 0"
    icon="mdi-upload-off"
  >
    <template #text>
      <strong>No playlist mappings defined.</strong> Define playlist mappings in
      <RouterLink to="/settings">
        Settings
      </RouterLink> if you want your videos added to YouTube playlists after being
      uploaded and to use the Match Upload Status report.
    </template>
  </VAlert>
</template>
<script lang="ts" setup>
import {usePlaylistsStore} from "@/stores/playlists";

const playlistsStore = usePlaylistsStore();
playlistsStore.getPlaylists();

interface IProps {
  rounded?: number;
}
const props = defineProps<IProps>();
</script>
