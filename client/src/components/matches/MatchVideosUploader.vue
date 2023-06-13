<template>
  <div>
    <div v-for="video in videos" :key="video.path ?? 'none'">
      <p>
        {{ video.videoTitle }} - {{ video.path }} - {{ video.description }} - {{ video.videoPrivacy }}
      </p>
    </div>
    <VDialog v-model="showDialog"
             persistent
             width="auto"
    >
      <template v-slot:activator="{ props }">
        <VBtn color="success"
              size="large"
              :disabled="!videos.length"
              v-bind="props"
        >
          Start upload
        </VBtn>
      </template>
      <VCard>
        <VCardTitle>Confirm upload</VCardTitle>
        <VCardText>
          <VList>
            <VListItem v-for="video in videos"
                       :key="video.path ?? 'none'"
                       prepend-icon="mdi-close"
                       :title="video.videoTitle ?? 'No title'"
                       :subtitle="`${video.path} - ${video.videoPrivacy}`"
            >
              <template v-slot:append>
                <VBtn v-if="false"
                      density="default"
                      variant="text"
                      icon="mdi-open-in-new"
                      href="https://youtube.com"
                      target="_blank"
                />
              </template>
            </VListItem>
          </VList>
        </VCardText>
        <VCardActions>
          <VBtn @click="() => showDialog = false">
            Cancel
          </VBtn>
          <VBtn color="success"
                size="large"
                :disabled="!videos.length"
                @click="uploadVideos"
          >
            Start upload
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script lang="ts" setup>

import {MatchVideoUploadInfo} from "@/types/MatchVideoUploadInfo";
import {computed, ref} from "vue";

interface IProps {
  videos: MatchVideoUploadInfo[];
}

const showDialog = ref(false);

const props = defineProps<IProps>();

function uploadVideo() {
  console.log("uploadVideo");
}

function uploadVideos() {
  console.log("hi");
  showDialog.value = false;
}
</script>
