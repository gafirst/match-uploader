<template>
  <VCard class="mt-2 mb-2"
         variant="outlined"
         color="purple"
  >
    <VCardTitle><VIcon icon="mdi-clock-fast" class="mr-2" />Live mode <VChip>Beta</VChip></VCardTitle>
    <VCardText style="color: initial">
      <VAlert color="purple"
              variant="tonal"
              class="mb-4"
              density="compact"
              icon="mdi-bug-outline"
      >
        Report bugs and send feedback
        <a target="_blank" href="https://github.com/gafirst/match-uploader/issues/new/choose">on GitHub</a>.
      </VAlert>
      <template v-if="!liveMode.isActive">
        <p class="mb-2">
          Live Mode watches for video files and queues uploads once all of a match's
          <strong>expected</strong> video files are found.
        </p>
        <p class="mb-2">
          <strong>What makes a video file expected?</strong> If you have a playlist mapping for a label, then Live Mode
          will expect a video to exist for it.
        </p>

        <VDivider class="mb-2 border-opacity-25" thickness="2" />
      </template>
      <template v-if="!liveMode.isAllowed">
        <p>Some requirements to use Live Mode are not met:</p>
        <VList>
          <TaskListItem v-for="[requirement, requirementMet] in Object.entries(liveMode.requirements).filter(([_, met]) => !met)"
                        :key="requirement"
                        :complete="requirementMet"
                        density="compact"
          >
            {{ liveModeRequirementToUiString(requirement) }}
          </TaskListItem>
        </VList>
      </template>
      <VAlert v-if="liveMode.isAllowed && !liveMode.isActive"
              variant="outlined"
              color="success"
              density="compact"
              icon="mdi-information-outline"
              class="mb-4"
      >
        Live Mode is ready!
      </VAlert>
      <template v-else>
        <h2 v-if="liveMode.isActive" class="mb-2">
          Live Mode is active <VChip v-if="liveMode.error || liveMode.state === LiveModeStatus.ERROR">Paused</VChip><VChip v-else-if="liveMode.isFastActive">Fast</VChip><VChip v-else-if="liveMode.isSlowActive">Slow</VChip>
        </h2>
        <p v-if="liveMode.isActive" class="mb-3">
          Keep this tab open—Live Mode runs in your browser.
        </p>

        <VAlert v-if="liveMode.error || liveMode.state === LiveModeStatus.ERROR"
                variant="outlined"
                color="error"
                density="compact"
                icon="mdi-alert-circle"
                class="mb-4"
        >
          <VAlertTitle class="mb-2">Live Mode is paused due to an error</VAlertTitle>
          <p class="mb-2">{{ liveMode.error ?? "An unknown error occurred" }}</p>

          <p class="mb-2">Once you've resolved the error, press <strong>Retry</strong> below to try again.</p>
          <VBtn class="mb-2" @click="liveMode.clearErrorAndTick">Retry</VBtn>
        </VAlert>

        <VAlert v-else-if="liveMode.missingPlaylistLabels.length > 0"
                variant="outlined"
                color="warning"
                density="compact"
                icon="mdi-alert-circle"
                class="mb-4"
        >
          Missing required video{{ liveMode.missingPlaylistLabels.length > 1 ? "s" : "" }}:
          {{ liveMode.missingPlaylistLabels.sort().join(", ") }}
        </VAlert>

        <VAlert v-if="liveMode.state === LiveModeStatus.WAITING"
                variant="outlined"
                color="purple"
                density="compact"
                icon="mdi-sleep"
                class="mb-4"
        >
          <template v-if="liveMode.isFastActive">
            Sleeping, next refresh in a few seconds
          </template>
          <template v-else>
            Sleeping, next refresh at {{ dayjs(liveMode.estimatedNextTick).format("h:mm A") }}
          </template>
        </VAlert>

        <VAlert v-if="liveMode.state === LiveModeStatus.ADVANCE_MATCH"
                variant="outlined"
                color="info"
                density="compact"
                icon="mdi-loading mdi-spin"
                class="mb-4"
        >
          Advancing match...
        </VAlert>
        <VAlert v-if="liveMode.state === LiveModeStatus.FETCH_VIDEOS"
                variant="outlined"
                color="info"
                density="compact"
                icon="mdi-loading mdi-spin"
                class="mb-4"
        >
          Fetching videos...
        </VAlert>
        <VAlert v-if="liveMode.state === LiveModeStatus.QUEUE_UPLOADS"
                variant="outlined"
                color="info"
                density="compact"
                icon="mdi-loading mdi-spin"
                class="mb-4"
        >
          Queueing videos for upload...
        </VAlert>

        <VAlert v-if="liveMode.isActive && liveMode.state === LiveModeStatus.STOPPED"
                variant="outlined"
                color="gray"
                density="compact"
                icon="mdi-pause"
                class="mb-4"
        >
          Paused, press Activate below to resume
        </VAlert>
      </template>

      <VBtn v-if="liveMode.isAllowed && !liveMode.isActive"
            class="mr-2 mb-0"
            color="purple"
            @click="liveMode.activate"
      >
        Start Live Mode
      </VBtn>
      <VBtn v-if="liveMode.isActive"
            class="mr-2"
            @click="liveMode.deactivate"
      >
        Deactivate
      </VBtn>
      <VBtn v-if="liveMode.isActive"
            :disabled="!!liveMode.error"
            @click="liveMode.triggerImmediateTick"
      >
        Check now
      </VBtn>
    </VCardText>
  </VCard>
</template>
<script lang="ts" setup>
import { useLiveModeStore } from "@/stores/liveMode";
import { liveModeRequirementToUiString } from "@/types/liveMode/LiveModeRequirements";
import TaskListItem from "@/components/util/TaskListItem.vue";
import dayjs from "dayjs";
import { LiveModeStatus, liveModeStatusToUiString } from "@/types/liveMode/LiveModeStatus";
import { computed } from "vue";

const liveMode = useLiveModeStore();
</script>
