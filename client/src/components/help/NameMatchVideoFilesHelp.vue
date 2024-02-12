<template>
  <!--  Make sure to use this component within Vuetify's VExpansionPanels component-->
  <VExpansionPanel>
    <VExpansionPanelTitle>
      How to name match video files
    </VExpansionPanelTitle>
    <VExpansionPanelText>
      <p>
        For a more detailed explanation, see the
        <a href="https://github.com/gafirst/match-uploader/blob/main/README.md#video-directory-structure"
           target="_blank"
        >
          Video directory structure</a> section in the Match Uploader README.
      </p>
      <br />
      <p>File name matching is <strong>not</strong> case-sensitive.</p>
      <br />
      <p>
        The .mp4 extension is used in examples as a placeholder, but you may use any file extension/type that is
        accepted for uploads on YouTube.
      </p>
      <br />
      <p>
        Within the videos directory, place match videos within subdirectories for each video label (or
        use <code>unlabeled</code> for no label) that you have:
      </p>
      <pre>
videos/
├─ unlabeled/
│  ├─ Qualification 1.mp4
│  ├─ Qualification 2.mp4
├─ $LABEL/
│  ├─ Qualification 1.mp4
│  ├─ Qualification 2.mp4
        </pre>
      <strong>Qualification matches:</strong>
      <pre>$Label/Qualification #.mp4</pre>
      <p><strong>Examples</strong>: unlabeled/Qualification 1.mp4, Overhead/Qualification 1.mp4</p>
      <br />
      <strong>Double elimination playoff matches:</strong>
      <pre>$Label/Playoff #.mp4</pre>
      <pre>$Label/Final #.mp4</pre>
      <p><strong>Examples</strong>: Overhead/Playoff 10.mp4, Feed B/Final 1.mp4</p>
      <br />
      Be sure to set your playoff type in Settings so we know how to parse your playoff matches!
    </VExpansionPanelText>
  </VExpansionPanel>
</template>
<script lang="ts" setup>
</script>
