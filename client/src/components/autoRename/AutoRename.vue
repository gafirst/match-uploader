<template>
  <VSheet>
    <h2>How it works: Auto rename</h2>
    Auto Rename tries to associate video files to matches. To use it:
    <ol class="ml-8">
      <li>Have your video recording software output files including a timestamp matching the time recording started in the file name</li>
      <li>Tell Match Uploader how to parse the timestamp out of your video file names</li>
    </ol>
    <br />
    <p>Every 5 minutes, Auto Rename performs a few tasks:</p>
    <ol class="ml-8">
      <li>For each video file with no associated match, compare the timestamp in the file name again match start times to find a closest match.</li>
      <li>A video association can be <strong>strong</strong> if the timestamp difference from the closest match start time is within 1 minute.</li>
      <li>A video association can be <strong>weak</strong> if the timestamp difference from the closest match start time is within 5 minutes.</li>
      <li>A video association is only made if a confident association is found; weak associations must be approved by a human.</li>
      <li>Auto Rename will mark an association for human review if it appears to be going out of order relative to other associations that have been made.</li>
      <li>TBD: Auto Rename will mark an association for human review if the associated video file fails one or more quality checks around detailed like video length, video size, file format, etc.</li>
    </ol>
    <br />
    <p>To keep Auto Rename functioning, regularly review any associations marked for review by doing one of the following:</p>
    <ol class="ml-8">
      <li>Click <strong>Review</strong> to view the video file and associated metadata and decide if it's correct or fix the association</li>
      <li>Click <strong>Ignore</strong> if you don't want to upload the video file to YouTube.</li>
      <li>Unmatch the association if it is correct but should not be associated</li>
    </ol>
    <br />
    <p>
      For best results, turn on Live Mode in a browser where you're using Auto Rename. These 2 features can work together
      to automatically upload video files.
    </p>
    <ol class="ml-8">
      <li>
        If a video file has a strong association, you have 5 minutes after the association is made before the video
        file is renamed and becomes eligible to be uploaded. After the file is renamed, if it hasn't been uploaded,
        you can try the <strong>Undo rename</strong> button to attempt to revert the file name so it can't be uploaded.
      </li>
    </ol>
  </VSheet>
  <h2>Review required</h2>
  <VAlert v-if="autoRenameStore.associationsError"
          class="mt-2"
          variant="tonal"
          color="error"
  >
    {{ autoRenameStore.associationsError }}
  </VAlert>
  <AutoRenameAssociations :included-association-statuses="[
    AutoRenameAssociationStatus.WEAK,
    AutoRenameAssociationStatus.FAILED
  ]"
  />
  <h2>Recently associated</h2>
  <AutoRenameAssociations :included-association-statuses="[
    AutoRenameAssociationStatus.STRONG
  ]"
  />
</template>
<script lang="ts" setup>
import { useAutoRenameStore } from "@/stores/autoRename";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";
import { ref } from "vue";
import AutoRenameAssociations from "@/components/autoRename/AutoRenameAssociations.vue";

const autoRenameStore = useAutoRenameStore();
autoRenameStore.getAssociations();

const selectedAssociation = ref(null);
const showReviewDialog = ref(false);

function statusToColor(status: string) {
  switch (status) {
    case "STRONG":
      return "success";
    case "WEAK":
      return "warning";
    case "FAILED":
      return "error";
    default:
      return "grey";
  }
}
</script>
<style scoped>
/* https://css-tricks.com/fluid-width-video/ */
video {
  /* override other styles to make responsive */
  width: 100% !important;
  height: auto !important;
}

.association-card {
  max-width: 30%;
  min-height: 500px;
}
</style>
