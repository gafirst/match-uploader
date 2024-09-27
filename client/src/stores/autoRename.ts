import { acceptHMRUpdate, defineStore } from "pinia";
import { AutoRenameAssociationStatus } from "@/types/autoRename/AutoRenameAssociationStatus";
import { ref, watch } from "vue";
import {
  AutoRenameAssociation,
  isAutoRenameAssociation,
  isAutoRenameAssociationApiResponse,
} from "@/types/autoRename/AutoRenameAssociation";
import {
  isWorkerEvent,
  isWorkerJobCompleteEvent,
  isWorkerJobCreatedEvent,
  isWorkerJobStartEvent,
  WorkerJobEvent,
} from "@/types/WorkerJob";
import { socket } from "@/socket";

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

  const isConnected = ref(false);
  const isInitialConnectionPending = ref(true);

  const events = ref<WorkerJobEvent[]>([]);

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
      console.log("Received autorename event", payload);
    });
  }

  return {
    associations,
    associationsInStatus,
    associationsError,
    bindEvents,
    confirmWeakAssociation,
    getAssociations,
    loadingAssociations,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAutoRenameStore, import.meta.hot));
}
