<template>
  <h2>Pending approval</h2>
  <VDataTable :items="associations"
              :headers="[
                { title: 'Label', value: 'videoLabel' },
                { title: 'File', key: 'videoFileName', value: item => item.videoFile },
                { title: 'Video', key: 'videoFile' },
                { title: 'Status', value: 'status' },
                { title: 'Match', value: 'matchKey' },
              ]"
  >
    <template v-slot:item.status="{ item }">
      <VChip :color="statusToColor(item.status)">{{ item.status }}</VChip>
    </template>

    <template v-slot:item.videoFile="{ item }">
      <video :src="`videos/${item.filePath}`"
             controls
             preload="metadata"
             class="pa-3"
             style="max-width: 300px;"
      />
    </template>

    <template v-slot:item.matchKey="{ item }">
      {{ item.match ?? "None" }}<br />
      <span style="color: gray">{{ item.matchKey ?? "" }}</span>
    </template>
  </VDataTable>
  <h2>Pending approval</h2>
  <VSheet class="d-flex flex-wrap">
    <VCard v-for="association in associations"
           :key="association.filePath"
           class="ma-3 association-card"
    >
      <VCardItem>
        <VCardTitle class="force-text-wrap">
          <VChip>
            {{ association.videoLabel }}
          </VChip> {{ association.videoFile }}
        </VCardTitle>
      </VCardItem>

      <VCardText>
        <VChip :color="statusToColor(association.status)">{{ association.status }}</VChip>
        <VList>
          <VListItem>
            <VListItemTitle>
              <strong>Associated match</strong>
            </VListItemTitle>
            <VListItemSubtitle>
              {{ association.matchKey ?? "None" }}
            </VListItemSubtitle>
          </VListItem>
          <VListItem>
            <VListItemTitle>
              <strong>Reason</strong>
            </VListItemTitle>
            <VListItemSubtitle>
              {{ association.statusReason }}
            </VListItemSubtitle>
          </VListItem>
          <VListItem v-if="association.status === 'STRONG'">
            <VListItemTitle>
              <strong>Rename completed</strong>
            </VListItemTitle>
            <VListItemSubtitle>
              {{ association.renameCompleted ? "Yes" : "No" }}
            </VListItemSubtitle>
          </VListItem>
        </VList>
        <h3>Video</h3>
        <video :src="`videos/${association.filePath}`"
               controls
               preload="metadata"
        />
        <VCardActions v-if="association.status === 'WEAK'">
          <VBtn variant="outlined"
                color="green"
                prepend-icon="mdi-check"
          >
            Accept
          </VBtn>
          <VBtn variant="outlined" prepend-icon="mdi-pencil">Change</VBtn>
          <VBtn variant="outlined" prepend-icon="mdi-fast-forward">Skip</VBtn>
        </VCardActions>
      </VCardText>
    </VCard>
  </VSheet>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const associations = ref([
  {
    "filePath": "Unlabeled/Match_ - 09 March 2024 - 02-51-53 PM.mp4",
    "videoFile": "Match_ - 09 March 2024 - 02-51-53 PM.mp4",
    "status": "STRONG",
    "statusReason": "strong association in job 443",
    "videoTimestamp": "2024-03-09T19:51:53.000Z",
    "associationAttempts": 2,
    "maxAssociationAttempts": 5,
    "matchKey": "2024scand_sf6m1",
    "videoLabel": "Unlabeled",
    "renameCompleted": false,
    "newFileName": null,
    "createdAt": "2024-08-31T04:18:13.546Z",
    "updatedAt": "2024-08-31T04:20:02.609Z",
    "match": "Playoff 6 (R2)",
  },
  {
    "filePath": "Unlabeled/Match_ - 09 April 2024 - 03-09-42 PM.mp4",
    "videoFile": "Match_ - 09 April 2024 - 03-09-42 PM.mp4",
    "status": "FAILED",
    "statusReason": "Max attempts reached",
    "videoTimestamp": "2024-04-09T19:09:42.000Z",
    "associationAttempts": 2,
    "maxAssociationAttempts": 2,
    "matchKey": null,
    "videoLabel": "Unlabeled",
    "renameCompleted": false,
    "newFileName": null,
    "createdAt": "2024-08-31T04:22:06.447Z",
    "updatedAt": "2024-08-31T04:23:00.752Z",
  },
  {
    "filePath": "Unlabeled/Match_ - 09 March 2024 - 03-09-42 PM.mp4",
    "videoFile": "Match_ - 09 March 2024 - 03-09-42 PM.mp4",
    "status": "WEAK",
    "statusReason": "weak association in job 444",
    "videoTimestamp": "2024-03-09T20:09:42.000Z",
    "associationAttempts": 3,
    "maxAssociationAttempts": 5,
    "matchKey": "2024scand_sf7m1",
    "videoLabel": "Unlabeled",
    "renameCompleted": false,
    "newFileName": null,
    "createdAt": "2024-08-31T04:18:13.554Z",
    "updatedAt": "2024-08-31T04:21:30.399Z",
    "match": "Playoff 7 (R2)",
  }]);

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
