<template>
  <!--  Make sure to use this component within Vuetify's VExpansionPanels component-->
  <VExpansionPanel>
    <VExpansionPanelTitle>
      Missing playlist mapping warnings
    </VExpansionPanelTitle>
    <VExpansionPanelText>
      <VAlert class="mt-1 mb-2">
        If you don't want the video to be uploaded to a playlist, you can ignore this warning.
      </VAlert>
      <ol class="ml-4">
        <li>
          In <strong>Settings</strong>, scroll down to the <strong>Playlist mappings</strong> section.
        </li>
        <li>
          Ensure you have defined a playlist mapping for the video's label (listed above the video preview).
        </li>
      </ol>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>
<script lang="ts" setup>
</script>
