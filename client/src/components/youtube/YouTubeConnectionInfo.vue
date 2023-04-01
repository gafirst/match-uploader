<template>
  <h3>Authentication status <VChip v-if="googleAuthStatus" :color="youtubeAuthSuccessState">{{ googleAuthStatus }}</VChip></h3>
  <VProgressCircular indeterminate v-if="!youTubeAuthState"/>
  <VAlert v-else-if="!!error"
          color="error"
  >
    {{ error }}
  </VAlert>
  <div v-else>
    <VList>
      <TaskListItem :complete="youTubeAuthState?.clientIdProvided">OAuth2 client ID provided</TaskListItem>
      <TaskListItem :complete="youTubeAuthState?.clientSecretProvided">OAuth2 client secret provided</TaskListItem>
      <TaskListItem :complete="youTubeAuthState?.accessTokenStored">Access token stored</TaskListItem>
      <TaskListItem :complete="youTubeAuthState?.refreshTokenStored">Refresh token stored</TaskListItem>
    </VList>
    <h4 class="mb-3">Manage YouTube authentication</h4>
    <VBtn class="mb-3"
          v-if="showYouTubeSignInBtn" href="/api/v1/youtube/auth">Sign in to YouTube
    </VBtn>
    <br v-if="showYouTubeSignInBtn" />
    <ResetYouTubeConnection class="mb-3"
      v-if="showResetYouTubeConnectionBtn"
                            @reset-completed="emit('triggerRefresh')"
    >
      Reset YouTube connection
    </ResetYouTubeConnection>
    <br />
  </div>

</template>

<script lang="ts" setup>

import {computed, onMounted, ref} from "vue";
import {IYouTubeAuthState} from "@/types/youtube/IYouTubeAuthState";
import TaskListItem from "@/components/util/TaskListItem.vue";
import ResetYouTubeConnection from "@/components/youtube/ResetYouTubeConnection.vue";

const loading = ref(true);
const error = ref("");

interface IProps {
  googleAuthStatus?: string;
  youTubeAuthState: IYouTubeAuthState | null,
}

const props = defineProps<IProps>();
const emit = defineEmits(['triggerRefresh'])

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

const showYouTubeSignInBtn = computed(() => {
  return !props.youTubeAuthState?.accessTokenStored;
});

const showResetYouTubeConnectionBtn = computed(() => {
  return props.youTubeAuthState?.accessTokenStored
    || props.youTubeAuthState?.refreshTokenStored
    || props.youTubeAuthState?.clientIdProvided
    || props.youTubeAuthState?.clientSecretProvided;
});

</script>

<style scoped>
.visibility-hidden {
  visibility: hidden;
}
</style>
