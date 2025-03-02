import { acceptHMRUpdate, defineStore } from "pinia";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";
import { computed, ref, watch } from "vue";
import {
  AutoRenameAssociation,
  isAutoRenameAssociation,
  isAutoRenameAssociationApiResponse,
} from "@/types/autoRename/AutoRenameAssociation";
import { socket } from "@/socket";

export const useAutoRenameStore = defineStore("autoRename", () => {
  const associations = ref<Map<string, AutoRenameAssociation>>(new Map<string, AutoRenameAssociation>());
  const associationsList = computed(() => Array.from(associations.value.values()));
  const loadingAssociations = ref(false);
  const associationsError = ref("");

  function handleGetAssociationsError(result: Response, message: string) {
    if (!result.ok) {
      associationsError.value = `API error (${result.status} ${result.statusText}): ${message}`;
      return true;
    }

    return false;
  }

  async function getAssociations(forceRefresh: boolean = false) {
    loadingAssociations.value = true;
    associationsError.value = "";

    if (forceRefresh) {
      associations.value.clear();
    }

    const url = "/api/v1/autoRename/associations";
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

    for (const association of resultJson.associations) {
      associations.value.set(association.filePath, association);
    }

    loadingAssociations.value = false;
  }

  function associationsInStatus(statuses: AutoRenameAssociationStatus | AutoRenameAssociationStatus[]) {
    if (!Array.isArray(statuses)) {
      statuses = [statuses];
    }

    return associationsList.value.filter((association) => statuses.includes(association.status));
  }

  const confirmWeakAssociationError = ref("");
  const confirmWeakAssociationLoading = ref(false);

  async function confirmWeakAssociation(association: AutoRenameAssociation, newMatchKey: string | null = null) {
    confirmWeakAssociationError.value = "";
    confirmWeakAssociationLoading.value = true;
    const matchKeyExtra = newMatchKey ? { matchKey: newMatchKey } : {};

    const response = await fetch("/api/v1/autoRename/associations/confirm", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filePath: association.filePath,
        videoLabel: association.videoLabel,
        ...matchKeyExtra,
      }),
    })
      .catch((error) => {
        confirmWeakAssociationError.value = `Unable to confirm association: ${error}`;
        confirmWeakAssociationLoading.value = false;
        return null;
      });

    if (!response) {
      return;
    }

    if (!response.ok) {
      const errorResponse = await response.json();
      confirmWeakAssociationError.value = errorResponse.message || "Unable to confirm association";
    }
    confirmWeakAssociationLoading.value = false;
  }

  const ignoreAssociationError = ref("");
  const ignoreAssociationLoading = ref(false);

  async function ignoreAssociation(association: AutoRenameAssociation) {
    console.log("Ignoring association", association);
    ignoreAssociationError.value = "";
    ignoreAssociationLoading.value = true;
    const response = await fetch("/api/v1/autoRename/associations/ignore", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filePath: association.filePath,
        videoLabel: association.videoLabel,
      }),
    })
      .catch((error) => {
        ignoreAssociationError.value = `Unable to ignore association: ${error}`;
        ignoreAssociationLoading.value = false;
        return null;
      });

    if (!response) {
      return;
    }

    if (!response.ok) {
      const errorResponse = await response.json();
      ignoreAssociationError.value = errorResponse.message || "Unable to ignore association";
    }
    ignoreAssociationLoading.value = false;
  }

  const undoRenameError = ref("");
  const undoRenameLoading = ref(false);

  async function undoRename(association: AutoRenameAssociation) {
    undoRenameError.value = "";
    undoRenameLoading.value = true;
    const response = await fetch("/api/v1/autoRename/associations/undoRename", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filePath: association.filePath,
      }),
    })
      .catch((error) => {
        undoRenameError.value = `Unable to undo rename: ${error}`;
        undoRenameLoading.value = false;
        return null;
      });

    if (!response) {
      return;
    }

    if (!response.ok) {
      const errorResponse = await response.json();
      undoRenameError.value = errorResponse.message || "Unable to undo rename";
    }
    undoRenameLoading.value = false;
  }

  const triggerNowError = ref("");
  const triggerNowLoading = ref(false);
  const triggerNowSuccess = ref(false);

  async function triggerNow() {
    triggerNowError.value = "";
    triggerNowSuccess.value = false;
    triggerNowLoading.value = true;
    const response = await fetch("/api/v1/worker/debug/autoRename")
      .catch((error) => {
        triggerNowError.value = `Unable to trigger auto rename: ${error}`;
        triggerNowLoading.value = false;
        return null;
      });

    if (!response) {
      return;
    }

    if (!response.ok) {
      const errorResponse = await response.json();
      triggerNowError.value = errorResponse.message || "Unable to trigger auto rename";
    }

    const data = await response.json();

    if (!data.success) {
      console.error("Failed to trigger auto rename", data);
      triggerNowError.value = "Unable to trigger auto rename";
    }

    triggerNowLoading.value = false;
    triggerNowSuccess.value = true;
  }

  function isEditable(association: AutoRenameAssociation) {
    if (association.status === AutoRenameAssociationStatus.STRONG) {
      const editable = !association.renameCompleted;
      return editable;
    }

    return true;
  }

  const isConnected = ref(false);
  const isInitialConnectionPending = ref(true);

  watch(isConnected, (newValue) => {
    console.log("isConnected changed to", newValue);
  });

  /**
   * Binds Socket.IO listeners
   *
   * Adapted from https://socket.io/how-to/use-with-vue#with-pinia
   */
  function bindEvents() {
    socket.on("connect", () => {
      isConnected.value = true;
      isInitialConnectionPending.value = false;
      console.log("Connected to socket.io server!");
    });

    socket.on("disconnect", () => {
      isConnected.value = false;
    });

    socket.on("autorename", async (payload) => {
      console.log("Received autorename event", payload.association);
      if (!isAutoRenameAssociation(payload.association)) {
        console.warn("Ignoring invalid autorename event", payload);
        return;
      }

      associations.value.set(payload.association.filePath, payload.association);
    });
  }

  return {
    associations: associationsList,
    associationsMap: associations,
    associationsInStatus,
    associationsError,
    bindEvents,
    confirmWeakAssociation,
    confirmWeakAssociationError,
    confirmWeakAssociationLoading,
    getAssociations,
    ignoreAssociation,
    ignoreAssociationError,
    ignoreAssociationLoading,
    isEditable,
    loadingAssociations,
    triggerNow,
    triggerNowError,
    triggerNowLoading,
    triggerNowSuccess,
    undoRename,
    undoRenameError,
    undoRenameLoading,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAutoRenameStore, import.meta.hot));
}
