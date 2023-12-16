import {socket} from "@/socket";
import {acceptHMRUpdate, defineStore} from "pinia";
import {ref, watch} from "vue";

type WorkerEvent = "worker:job:start" | "worker:job:complete" | "unknown";


interface WorkerJob {
  id: string;
  event: WorkerEvent;
  jobName: string;
  jobId: string;
  statusDescription: string;
}

export const useWorkerStore = defineStore("worker", () => {
  const isConnected = ref(false);
  const isInitialConnectionPending = ref(true);

  const events = ref<WorkerJob[]>([]);

  watch(isConnected, (newValue) => {
    console.log("isConnected changed to", newValue);
  });

  function addEvent(data: any) {
    if (!data || !data.event || !data.jobId || !data.jobName) {
      return;
    }

    const event: WorkerJob = {
      event: data.event || "unknown",
      id: `${data.jobId}/${data.event}`,
      jobName: data.jobName,
      jobId: data.jobId,
      statusDescription: data.success ? "success" : "error",
    };

    events.value = [event, ...events.value];
  }

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

    socket.on("worker", (payload) => {
      console.log("Received worker payload!!!", payload);
      addEvent(payload);
    });
  }

  return {
    bindEvents,
    events,
    isConnected,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkerStore, import.meta.hot));
}
