<template>
  <div class="text-center">
    <VProgressCircular
      indeterminate
      :color="color"
      :width="width"
    />
  </div>
</template>
<script lang="ts" setup>
interface IProps {
  color?: string;
  width?: number;
}

withDefaults(defineProps<IProps>(), {
  color: "primary",
  width: 3,
});
</script>
