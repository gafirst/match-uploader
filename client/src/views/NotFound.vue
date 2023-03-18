<template>
  <generic-error title="Not Found" message="Whoops, that page doesn't exist" />
</template>

<script>
import GenericError from "@/components/util/GenericError.vue";

export default {
  name: "NotFound",
  components: {GenericError}
}
</script>

<style scoped>

</style>
