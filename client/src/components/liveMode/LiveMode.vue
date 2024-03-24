<template>
  <VCard class="mt-2 mb-2"
         variant="outlined"
         color="purple"
  >
    <VCardTitle><VIcon icon="mdi-clock-fast" class="mr-2" />Live mode <VChip>Beta</VChip></VCardTitle>
    <VCardText style="color: initial">
      <VAlert color="purple"
              variant="tonal"
              class="mb-2"
      >
        Report bugs and send feedback
        <a target="_blank" href="https://github.com/gafirst/match-uploader/issues/new/choose">on GitHub</a>.
      </VAlert>
      <p class="mb-2">
        Live Mode watches for video files and queues uploads once all of a match's
        <strong>expected</strong> video files are found.
      </p>
      <p class="mb-2">
        <strong>What makes a video file expected?</strong> If you have a playlist mapping for a label, then Live Mode
        will expect a video to exist for it.
      </p>

      <template v-if="!liveMode.isAllowed">
        <p>Some requirements to enable Live Mode are not met:</p>
        <VList>
          <TaskListItem v-for="[requirement, requirementMet] in Object.entries(liveMode.requirements)"
                        :key="requirement"
                        :complete="requirementMet"
                        density="compact"
          >
            {{ liveModeRequirementToUiString(requirement) }}
          </TaskListItem>
        </VList>
      </template>
      <VAlert v-else
              variant="outlined"
              color="info"
              icon="mdi-information-outline"
              class="mb-2"
      >
        Ready to enable!
      </VAlert>

      <!--      <VBtn @click="liveMode.resume">Start Live Mode</VBtn>-->
      <!--      <VBtn @click="liveMode.pause">Stop Live Mode</VBtn>-->
      <p>Live Mode state: {{ liveMode.isActive }}</p>
      <p>Live Mode status: {{ liveMode.state }}</p>
      <VBtn v-if="liveMode.isAllowed && !liveMode.isActive"
            class="mr-2"
            @click="liveMode.activate"
      >
        Activate
      </VBtn>
      <VBtn v-if="liveMode.isActive"
            class="mr-2"
            @click="liveMode.deactivate"
      >
        Deactivate
      </VBtn>
      <VBtn v-if="liveMode.isActive" @click="liveMode.triggerImmediateTick">Check now</VBtn>
    </VCardText>
  </VCard>
</template>
<script lang="ts" setup>
import { useLiveModeStore } from "@/stores/liveMode";
import {
  liveModeRequirementToErrorString,
  liveModeRequirementToUiString,
} from "../../types/liveMode/LiveModeRequirements";
import TaskListItem from "@/components/util/TaskListItem.vue";

const liveMode = useLiveModeStore();
</script>
