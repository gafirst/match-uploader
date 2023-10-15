<template>
  <!--  Make sure to use this component within Vuetify's VExpansionPanels component-->
  <VExpansionPanel>
    <VExpansionPanelTitle>
      Video upload errors
    </VExpansionPanelTitle>
    <VExpansionPanelText>
      <ul class="ml-4">
        <li>
          <strong>Invalid credentials:</strong> If you have successfully connected a YouTube channel in the past, go to
          <strong>Settings</strong> > <strong>Retry YouTube Connection</strong>.
        </li>
        <li>
          <strong>Playlist not found:</strong> Ensure a valid playlist mapping exists for the video's label. You can
          define no mapping to skip playlist uploads. Otherwise, the channel you are uploading to needs to be able to
          add videos to the playlist ID specified.
        </li>
      </ul>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>
<script lang="ts" setup>
</script>
