<template>
  <p>Authentication status: <VChip color="error">Incomplete</VChip></p>
  <VList>
    <VListItem v-if="!youtubeAuthStatus.clientInfo"
               prepend-icon="mdi-close"
               class="text-error"

    >Provide client-secrets.json</VListItem>
    <VListItem v-if="!youtubeAuthStatus.authFlow" prepend-icon="mdi-close" class="text-error">Complete YouTube authentication</VListItem>
    <VListItem v-if="!youtubeAuthStatus.tokensStored" prepend-icon="mdi-close" class="text-error">Access/refresh tokens stored</VListItem>
  </VList>
  <VBtn to="/settings/youtube">Connect YouTube channel</VBtn>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import {IYouTubeAuthStatus} from "@/types/youtube/IYouTubeAuthStatus";

const youtubeAuthStatus = ref<IYouTubeAuthStatus>({
  clientInfo: false,
  authFlow: false,
  tokensStored: false,
})
</script>

<style scoped>

</style>
