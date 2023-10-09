<template>
  <!--  Make sure to use this component within Vuetify's VExpansionPanels component-->
  <VExpansionPanel>
    <VExpansionPanelTitle>
      How to name match video files
    </VExpansionPanelTitle>
    <VExpansionPanelText>
      <p>File name matching is <strong>not</strong> case-sensitive.</p>
      <br />
      <p>
        The .mp4 extension is used in examples as a placeholder, but you may use any file extension/type that is
        accepted for uploads on YouTube.
      </p>
      <br />
      <strong>Qualification matches:</strong>
      <pre>Qualification #[ Label].mp4</pre>
      <pre>Qualification #[ Label].mp4</pre>
      <p><strong>Examples</strong>: Qualification 1.mp4, Qualification 1 Overhead.mp4, Qualification 1.wav</p>
      <br />
      <strong>Double elimination playoff matches:</strong>
      <pre>Playoff #[ Label].mp4</pre>
      <br />
      <strong>Best of 3 playoff matches:</strong>
      <pre>Quarterfinal #[ Label].mp4</pre>
      <pre>Semifinal #[ Label].mp4</pre>
      <pre>Final #[ Label].mp4</pre>

      <br />
      Be sure to set your playoff type in Settings so we know how to parse your playoff matches!
    </VExpansionPanelText>
  </VExpansionPanel>
</template>
<script lang="ts" setup>
</script>
