<template>
  <VRow>
    <VCol md="6">
      <h1>Connect YouTube channel</h1>
      <StepsCollection class="mb-4">
        <Step :active="isActive(StepName.PROVIDE_CLIENT_SECRETS)"
              :complete="isComplete(StepName.PROVIDE_CLIENT_SECRETS)">Provide client-secrets.json
        </Step>
        <Step :active="isActive(StepName.YOUTUBE_AUTH)"
              :complete="isComplete(StepName.YOUTUBE_AUTH)">Complete YouTube authentication
        </Step>
      </StepsCollection>

      <div v-if="isActive(StepName.PROVIDE_CLIENT_SECRETS)">
        <p class="mb-3">In your Google Cloud project, create an OAuth2 desktop client. Download the JSON file containing
          the client
          info. We'll use this information to generate credentials to access YouTube on your behalf.</p>
        <VForm>
          <VTextarea clearable
                     label="OAuth2 client info"
                     variant="outlined"
                     auto-grow
          />
        </VForm>

        <VBtn class="float-right" @click="nextStep()">Next</VBtn>
      </div>
      <div v-else-if="isActive(StepName.YOUTUBE_AUTH)">
        <p class="mb-2">Click the button below to sign into YouTube and store your credentials locally.</p>

        <VBtn @click="previousStep()">Back</VBtn>
        <VBtn class="float-right" @click="nextStep()">Sign in with Google</VBtn>
      </div>
    </VCol>
  </VRow>

</template>

<script lang="ts" setup>

import StepsCollection from "@/components/steps/StepsCollection.vue";
import Step from "@/components/steps/Step.vue";
import {ref} from "vue";
import AutosavingTextInput from "@/components/form/AutosavingTextInput.vue";

enum StepName {
  PROVIDE_CLIENT_SECRETS = 0,
  YOUTUBE_AUTH = 1,
}

const activeStep = ref(StepName.PROVIDE_CLIENT_SECRETS)

function isActive(step: StepName): boolean {
  return step === activeStep.value;
}

function isComplete(step: StepName): boolean {
  return step < activeStep.value;
}

function previousStep() {
  activeStep.value--;
}

function nextStep() {
  activeStep.value++;
}

</script>

<style scoped>
textarea {
  max-width: 300px !important;
}
</style>
