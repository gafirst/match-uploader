<template>
  <MainLayout style="overflow: hidden" />
</template>

<script setup lang="ts">
import MainLayout from "@/layouts/Main.vue";
import {useWorkerStore} from "@/stores/worker";
import { socket } from "@/socket";
import { useAutoRenameStore } from "@/stores/autoRename";

// TODO: Should we pull out websocket logic into its own store?
const workerStore = useWorkerStore();
const autoRenameStore = useAutoRenameStore();

// Adapted from https://socket.io/how-to/use-with-vue#with-pinia
// remove any existing listeners (after a hot module replacement)
socket.off();

// FIXME: Navbar needs to consider both stores' connection status
workerStore.bindEvents();
autoRenameStore.bindEvents();

</script>

<style>
  @import "style/global.css";
</style>
