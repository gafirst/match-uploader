<template>
  <VBtn :color="btnColor"
        :prepend-icon="btnIcon"
        @click="resetYouTubeConnection"
  >
    {{ btnText }}
  </VBtn>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";

const confirm = ref(false);
const loading = ref(false);
const error = ref("");
const emit = defineEmits(["resetCompleted"]);
const success = ref(false);

async function resetYouTubeConnection() {
  if (!confirm.value) {
    confirm.value = true;
    return;
  }

  loading.value = true;
  const result = await fetch("/api/v1/youtube/auth/reset");

  if (!result.ok) {
    error.value = "YouTube connection reset failed";
  } else {
    success.value = true;
  }

  loading.value = false;
  confirm.value = false;
  emit("resetCompleted");
}

const btnColor = computed(() => {
  if (error.value) {
    return "error";
  }

  if (success.value) {
    return "success";
  }

  if (confirm.value) {
    return "warning";
  }

  return "";
});

const btnIcon = computed(() => {
  if (error.value) {
    return "mdi-alert";
  }

  if (success.value) {
    return "mdi-check";
  }

  return "";
});

const btnText = computed(() => {
  if (error.value) {
    return error.value;
  }

  if (confirm.value) {
    return "Click again to confirm reset";
  }

  if (success.value) {
    return "Successfully reset";
  }

  return "Reset YouTube connection";
});

</script>

<style scoped>

</style>
