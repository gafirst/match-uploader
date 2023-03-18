<template>
  <v-app>
    <v-app-bar color="surface-variant" title="FRC Match Uploader"></v-app-bar>
<!--    <v-app-bar title="Application bar"></v-app-bar>-->



<!--    <v-main style="min-height: 300px;"></v-main>-->
    <v-navigation-drawer expand-on-hover
                         permanent
                         rail
                         app
                         location="left">
      <v-list>
        <v-list-item v-for="item in navItems" :key="item.title" :title="item.title" link :prepend-icon="item.icon">
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import {INavItem} from "@/types/INavItem";

const navItems = ref<INavItem[]>([
  {
    title: "Upload",
    icon: "mdi-cloud-upload-outline",
  },
  {
    title: "Matches",
    icon: "mdi-format-list-numbered"
  },
  {
    title: "YouTube",
    icon: "mdi-youtube",
  },
  {
    title: "Settings",
    icon: "mdi-cog",
  },
  {
    title: "Logs",
    icon: "mdi-code-json",
  }
])
</script>
