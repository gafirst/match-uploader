<template>
  <VTimelineItem :dot-color="dotColor"
                 :icon="icon"
                 size="small"
                 :class="{'font-weight-bold': active}"
  >
    <slot class="text-bold" />
  </VTimelineItem>
</template>

<script lang="ts" setup>
import {computed} from "vue";

interface IProps {
  active?: boolean;
  complete?: boolean;
}

const props = defineProps<IProps>();

const dotColor = computed(() => {
  console.log("dotColor", props.active, props.complete)
  if (props.active) {
    return "primary";
  } else if (props.complete) {
    return "success";
  }

  return "inactive";
});
const icon = computed(() => {
  if (props.complete) {
    return "mdi-check";
  }

  return undefined;
});
</script>

<style scoped>

</style>
