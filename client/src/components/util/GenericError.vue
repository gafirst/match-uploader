<template>
  <h1>{{ title }}</h1>
  <p>{{ message }}</p>
</template>

<script lang="ts" setup>
interface IGenericErrorProps {
  title: string;
  message: string;
}

defineProps<IGenericErrorProps>();
</script>

<style scoped>

</style>
