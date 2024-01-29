<template>
  <MainLayout style="overflow: hidden" />
</template>

<script setup lang="ts">
import MainLayout from "@/layouts/Main.vue";
import {useWorkerStore} from "@/stores/worker";
import { socket } from "@/socket";

const workerStore = useWorkerStore();

// Adapted from https://socket.io/how-to/use-with-vue#with-pinia
// remove any existing listeners (after a hot module replacement)
socket.off();

workerStore.bindEvents();

</script>

<style>
  @import "style/global.css";
</style>
