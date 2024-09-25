import { acceptHMRUpdate, defineStore } from "pinia";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";
import { ref } from "vue";
import {
  AutoRenameAssociation,
  isAutoRenameAssociation,
  isAutoRenameAssociationApiResponse,
} from "@/types/autoRename/AutoRenameAssociation";

export const useAutoRenameStore = defineStore("autoRename", () => {
  const associations = ref<AutoRenameAssociation[]>([]);
  const loadingAssociations = ref(false);
  const associationsError = ref("");

  function handleGetAssociationsError(result: Response, message: string) {
    if (!result.ok) {
      associationsError.value = `API error (${result.status} ${result.statusText}): ${message}`;
      return true;
    }

    return false;
  }

  async function getAssociations() {
    loadingAssociations.value = true;
    associationsError.value = "";

    const url = status ? `/api/v1/autoRename/associations?status=${status}` : "/api/v1/autoRename/associations";
    const result = await fetch(url);

    if (handleGetAssociationsError(result, "Unable to load associations")) {
      loadingAssociations.value = false;
      return;
    }

    const resultJson = await result.json();

    if (!isAutoRenameAssociationApiResponse(resultJson)) {
      associationsError.value = "API error: Match associations response is invalid";
      loadingAssociations.value = false;
      return;
    }

    associations.value = resultJson.associations;
    loadingAssociations.value = false;
  }

  function associationsInStatus(statuses: AutoRenameAssociationStatus | AutoRenameAssociationStatus[]) {
    if (!Array.isArray(statuses)) {
      statuses = [statuses];
    }

    return associations.value.filter((association) => statuses.includes(association.status));
  }

  async function confirmWeakAssociation(association: AutoRenameAssociation, newMatchKey: string | null = null) {
    const matchKeyExtra = newMatchKey ? { matchKey: newMatchKey } : {};

    const result = await fetch("/api/v1/autoRename/associations/confirm", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filePath: association.filePath,
        videoLabel: association.videoLabel,
        ...matchKeyExtra,
      }),
    });

    // TODO: Error handling
  }

  return {
    associations,
    associationsInStatus,
    associationsError,
    confirmWeakAssociation,
    getAssociations,
    loadingAssociations,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAutoRenameStore, import.meta.hot));
}
