<template>
  <div>
    <p>
      After being uploaded, match videos may be added to a YouTube playlist. To enable this feature,
      specify the playlist where videos with a given label should be added.
    </p>
    <VExpansionPanels class="mt-2">
      <VExpansionPanel>
        <VExpansionPanelTitle>More on playlist mappings</VExpansionPanelTitle>
        <VExpansionPanelText>
          <p class="mt-2">
            <strong>Unlabeled videos:</strong> If a video's label does not have an associated playlist, it won't be
            added to a playlist. The label for videos without an explicit label is <strong>Unlabeled</strong>.
          </p>
          <p class="mt-2">
            <strong>Outdated playlist names:</strong> Playlist names are cached locally to reduce YouTube API calls.
            If you rename a playlist on YouTube, the name won't update here immediately, but videos will still be added
            to the correct playlist.
          </p>
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>

    <h3 class="mt-2">
      Current mappings
    </h3>
    <VProgressCircular
      v-if="playlistsStore.loading && !playlistsStore.playlists?.length"
      class="mt-2"
      indeterminate
    />
    <VList
      v-else
      :disabled=" playlistsStore.loading"
    >
      <VListItem
        v-for="playlist in playlistsStore.playlists"
        :key="playlist.playlist_id"
      >
        <VListItemTitle>
          Label <strong>{{ playlist.label }}</strong> →
          <a
            :href="youtubePlaylistUrl(playlist.playlist_id)"
            target="_blank"
          >{{
            playlist.name ?? "Unknown playlist"
          }}</a>
        </VListItemTitle>
        <VListItemSubtitle>
          ID: {{ playlist.playlist_id }}
        </VListItemSubtitle>
        <template #prepend>
          <VBtn
            icon
            :loading="playlistsStore.loading"
            variant="text"
            color="error"
            @click="deletePlaylistMapping(playlist.label)"
          >
            <VIcon>mdi-delete</VIcon>
          </VBtn>
        </template>
      </VListItem>
    </VList>

    <VAlert
      v-if="!playlistsStore.loading && !playlistsStore.playlists?.length"
      class="mb-2"
    >
      No playlist mappings found. Add one below!
    </VAlert>
    <VAlert
      v-if="!!playlistsStore.error"
      color="error"
    >
      {{ playlistsStore.error }}
    </VAlert>

    <h3 class="mt-2">
      Add mapping
    </h3>
    <VAlert
      v-if="!settingsStore.youTubeAuthState?.accessTokenStored"
      color="error"
      variant="tonal"
      :rounded="0"
      icon="mdi-alert-circle"
    >
      Complete YouTube authentication setup steps before adding playlist mappings.
    </VAlert>
    <VAlert
      v-else
      variant="tonal"
      color="info"
      class="mt-2"
      density="compact"
    >
      Enter <strong>Unlabeled</strong> to add videos with no label to a playlist.
    </VAlert>
    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="newMappingLabel"
          variant="underlined"
          label="Video label"
          hint="Not case-sensitive"
          persistent-hint
          type="text"
          :disabled="playlistsStore.loading || !settingsStore.youTubeAuthState?.accessTokenStored"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="newMappingPlaylistUrl"
          variant="underlined"
          label="Playlist ID"
          hint="Playlist ID starting with PL"
          persistent-hint
          type="text"
          :disabled="playlistsStore.loading || !settingsStore.youTubeAuthState?.accessTokenStored"
        />
      </VCol>
    </VRow>
    <VBtn
      color="primary"
      class="mt-2"
      :disabled="!newMappingLabel || !newMappingPlaylistUrl"
      :loading="playlistsStore.loading"
      @click="saveNewMapping"
    >
      Save mapping
    </VBtn>
  </div>
</template>
<script lang="ts" setup>
import { usePlaylistsStore } from "@/stores/playlists";
import { ref } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { youtubePlaylistUrl } from "@/util/playlists";

const settingsStore = useSettingsStore();
const playlistsStore = usePlaylistsStore();
playlistsStore.getPlaylists();

const newMappingLabel = ref("");
const newMappingPlaylistUrl = ref("");

async function saveNewMapping() {
  const success = await playlistsStore.savePlaylistMapping(newMappingLabel.value, newMappingPlaylistUrl.value);
  if (success) {
    await playlistsStore.getPlaylists();
    newMappingLabel.value = "";
    newMappingPlaylistUrl.value = "";
  }
}

async function deletePlaylistMapping(videoLabel: string) {
  const success = await playlistsStore.deletePlaylistMapping(videoLabel);
  if (success) {
    await playlistsStore.getPlaylists();
  }
}
</script>
