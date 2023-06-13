<template>
  <div>
    <ul>
      <li v-for="file in videoFileSuggestions" :key="file">
        {{ file }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {ref, watch} from "vue";

const props = defineProps<{
  matchKey: string,
}>();


</script>
