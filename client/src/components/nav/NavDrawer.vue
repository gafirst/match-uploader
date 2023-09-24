<template>
  <VNavigationDrawer permanent
                     expand-on-hover
                     rail
                     app
                     location="left"
  >
    <VList>
      <VListItem v-for="item in navItems"
                 :key="item.title"
                 :title="item.title"
                 :to="item.to"
                 :prepend-icon="item.icon"
      />
    </VList>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import {INavItem} from "@/types/INavItem";

const navItems = ref<INavItem[]>([
  {
    title: "Upload",
    to: "/upload",
    icon: "mdi-cloud-upload-outline",
  },
  {
    title: "Matches",
    to: "/matches",
    icon: "mdi-format-list-numbered",
  },
  {
    title: "Settings",
    to: "/settings",
    icon: "mdi-cog",
  },
  {
    title: "Logs",
    to: "/logs",
    icon: "mdi-code-json",
  },
]);
</script>

<style scoped>

</style>
