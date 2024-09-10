<template>
  <VCard>
    <VCardTitle>Review association</VCardTitle>
    <VCardText>
      <p>Video: {{ props.association.videoFileName }}</p>
      <p>Match: {{ props.association.matchKey }}</p>
      <p>Status: {{ props.association.status }}</p>
      <p>Label: {{ props.association.videoLabel }}</p>
      <p>File: {{ props.association.videoFile }}</p>
    </VCardText>
    <VCardActions>
      <VBtn color="success" @click="$emit('close')">Close</VBtn>
    </vcardactions>
  </VCard>
</template>
<script lang="ts" setup>
import { AutoRenameAssociation } from "@/types/autoRename/AutoRenameAssociation";

defineEmits(["close"]);

const props = defineProps<{
  association: AutoRenameAssociation;
}>();
</script>
