<template>
  <VListItem
    :prepend-icon="complete ? 'mdi-check' : 'mdi-close'"
    :class="{ 'text-success': complete, 'text-error': !complete }"
    :density="density ?? 'compact'"
  >
    <slot />
  </VListItem>
</template>

<script lang="ts" setup>
interface IProps {
  complete?: boolean | null;
  density?: "compact" | "comfortable" | "default"
}

defineProps<IProps>();
</script>

<style scoped>

</style>
