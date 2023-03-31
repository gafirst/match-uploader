<template>
  <h3>Authentication status <VChip v-if="googleAuthStatus" :color="youtubeAuthSuccessState">{{ googleAuthStatus }}</VChip></h3>
  <VProgressCircular indeterminate v-if="loading"/>
  <VAlert v-else-if="!!error"
          color="error"
  >
    {{ error }}
  </VAlert>
  <div v-else>
    <VList>
      <TaskListItem :complete="youtubeAuthStatus?.clientIdProvided ?? false">OAuth2 client ID provided</TaskListItem>
      <TaskListItem :complete="youtubeAuthStatus?.clientSecretProvided ?? false">OAuth2 client secret provided</TaskListItem>
      <TaskListItem :complete="youtubeAuthStatus?.accessTokenStored ?? false">Access token stored</TaskListItem>
      <TaskListItem :complete="youtubeAuthStatus?.refreshTokenStored ?? false">Refresh token stored</TaskListItem>
    </VList>
    <h4>Manage YouTube authentication</h4>
    <VBtn v-if="youtubeAuthStatus?.clientIdProvided && youtubeAuthStatus?.clientSecretProvided" href="/api/v1/youtube/auth">Sign in to YouTube</VBtn><br />
    <VBtn class="mb-2" @click="refreshData" variant="outlined">Refresh current status</VBtn>
  </div>

</template>

<script lang="ts" setup>

import {computed, onMounted, ref} from "vue";
import {IYouTubeAuthStatus} from "@/types/youtube/IYouTubeAuthStatus";
import TaskListItem from "@/components/util/TaskListItem.vue";

const loading = ref(true);
const error = ref("");
const youtubeAuthStatus = ref<IYouTubeAuthStatus | null>(null);

interface IProps {
  googleAuthStatus?: string;
}

const props = defineProps<IProps>();

onMounted(async () => {
  loading.value = true;
  await refreshData();
})

async function refreshData() {
  const result = await fetch("/api/v1/youtube/auth/status");

  if (!result.ok) {
    loading.value = false;
    error.value = `Unable to load auth status: ${result.status} ${result.statusText}`
    return;
  }

  youtubeAuthStatus.value = await result.json();
  loading.value = false;
}

const youtubeAuthSuccessState = computed(() => {
  let authStatus = props.googleAuthStatus;
  if (!authStatus) {
    return "";
  }

  if (authStatus === "YouTube connection successful") {
    return "success";
  }

  if (authStatus.includes("Code exchange failed") || authStatus.includes("YouTube connection failed")) {
    return "error";
  }

  if (authStatus === "OAuth2 flow started") {
    return "warning"
  }

  return "";
})

</script>

<style scoped>
.visibility-hidden {
  visibility: hidden;
}
</style>
