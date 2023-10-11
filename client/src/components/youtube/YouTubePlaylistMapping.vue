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
            added to a playlist. Videos without an explicit label will use <strong>Unlabeled</strong> video label
            mapping.
          </p>
          <p class="mt-2">
            <strong>Outdated playlist names:</strong> Playlist names are cached locally to reduce YouTube API calls. If you rename a playlist, the name won't update
            here immediately, but videos will still be added to the correct playlist.
          </p>
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>

    <h3 class="mt-2">Current mappings</h3>
    <VList v-if="!playlistsStore.loading">
      <VListItem v-for="playlist in playlistsStore.playlists" :key="playlist.playlist_id">
        <VListItemTitle>
          Label <strong>{{ playlist.label }}</strong> →
          <a :href="youtubePlaylistUrl(playlist.playlist_id)" target="_blank">{{ playlist.name }}</a>
        </VListItemTitle>
      </VListItem>
    </VList>
    <VProgressCircular v-else indeterminate />

    <h3 class="mt-2">Add mapping</h3>
    <VRow>
      <VCol cols="12" md="6">
        <VTextField v-model="newMappingLabel"
                    variant="underlined"
                    label="Video label"
                    hint="Not case-sensitive"
                    persistent-hint
                    type="text"
        />
      </VCol>
      <VCol cols="12" md="6">
        <VTextField v-model="newMappingPlaylistUrl"
                    variant="underlined"
                    label="Playlist URL"
                    hint="Any URL for the playlist that includes its ID"
                    persistent-hint
                    type="text"
        />
      </VCol>
    </VRow>
    <VBtn color="primary"
          class="mt-2"
          :disabled="!newMappingLabel || !newMappingPlaylistUrl"
          @click="saveNewMapping"
    >
      Save mapping
    </VBtn>
  </div>
</template>
<script lang="ts" setup>
import {usePlaylistsStore} from "@/stores/playlists";
import {ref} from "vue";

const playlistsStore = usePlaylistsStore();
playlistsStore.getPlaylists();

const newMappingLabel = ref("");
const newMappingPlaylistUrl = ref("");

function youtubePlaylistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`;
}

function saveNewMapping() {
  playlistsStore.savePlaylistMapping(newMappingLabel.value, newMappingPlaylistUrl.value);
  newMappingLabel.value = "";
  newMappingPlaylistUrl.value = "";
}

</script>
