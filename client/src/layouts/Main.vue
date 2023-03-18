<template>
  <v-app>
    <v-app-bar color="primary" title="Match Uploader"></v-app-bar>
    <nav-drawer />
    <v-main>
      <v-container>
        <router-view/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import NavDrawer from "@/components/nav/NavDrawer.vue";
</script>
