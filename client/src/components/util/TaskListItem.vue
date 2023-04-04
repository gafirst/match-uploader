<template>
  <VListItem :prepend-icon="complete ? 'mdi-check' : 'mdi-close'"
             :class="{ 'text-success': complete, 'text-error': !complete }"
  >
    <slot />
  </VListItem>
</template>

<script lang="ts" setup>
interface IProps {
  complete?: boolean | null;
}

defineProps<IProps>();
</script>

<style scoped>

</style>
