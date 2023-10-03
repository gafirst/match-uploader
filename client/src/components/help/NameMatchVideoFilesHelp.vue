<template>
  <!--  Make sure to use this component within Vuetify's VExpansionPanels component-->
  <VExpansionPanel>
    <VExpansionPanelTitle>
      How to name match video files
    </VExpansionPanelTitle>
    <VExpansionPanelText>
      <strong>Qualification matches:</strong>
      <pre>Qualification #[ Label].mp4</pre>
      <br />
      <strong>Double elimination playoff matches:</strong>
      <pre>Playoff #[ Label].mp4</pre>
      <br />
      <strong>Best of 3 playoff matches:</strong>
      <pre>Quarterfinal #[ Label].mp4</pre>
      or
      <pre>Semifinal #[ Label].mp4</pre>
      or
      <pre>Final #[ Label].mp4</pre>

      <br />
      Be sure to set your playoff type in Settings so we know how to parse your playoff matches!
    </VExpansionPanelText>
  </VExpansionPanel>
</template>
<script lang="ts" setup>
</script>
