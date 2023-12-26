import {socket} from "@/socket";
import {acceptHMRUpdate, defineStore} from "pinia";
import {ref, watch} from "vue";

type WorkerEvent = "worker:job:created" | "worker:job:start" | "worker:job:complete" | "unknown";


interface WorkerJobEvent {
  id: string;
  event: WorkerEvent;
  jobName: string;
  jobId: string;
  statusDescription: string;
}

interface WorkerJob {
  jobId: string;
  workerId: string;
  task: string;
  title: string;
  status: string;
}

export const useWorkerStore = defineStore("worker", () => {
  const isConnected = ref(false);
  const isInitialConnectionPending = ref(true);

  const events = ref<WorkerJobEvent[]>([]);

  watch(isConnected, (newValue) => {
    console.log("isConnected changed to", newValue);
  });

  function addEvent(data: any) {
    if (!data || !data.event || !data.jobId || !data.jobName) {
      return;
    }

    const event: WorkerJobEvent = {
      event: data.event || "unknown",
      id: `${data.jobId}/${data.event}`,
      jobName: data.jobName,
      jobId: data.jobId,
      statusDescription: data.success ? "success" : "error",
    };

    events.value = [event, ...events.value];
  }

  const jobs = ref<WorkerJob[]>([]);
  const jobsLoading = ref(false);
  const jobsError = ref("");

  async function loadJobs() {
    // Load jobs by fetching from /api/v1/worker/jobs
    jobsLoading.value = true;
    jobsError.value = "";

    const jobsResult = await fetch("/api/v1/worker/jobs");

    if (!jobsResult.ok) {
      jobsError.value = `API error (${jobsResult.status} ${jobsResult.statusText}): Unable to load jobs`;
      jobsLoading.value = false;
      return;
    }

    jobs.value = (await jobsResult.json()) as WorkerJob[];
    jobsLoading.value = false;
  }

  // TODO: Fix up types
  async function updateJobStatus(jobId: string, status: string) {
    const index = jobs.value.findIndex((job: WorkerJob) => job.jobId === jobId);

    if (index === -1) {
      console.log("Job not found"); // TODO: in this case, create the job
      addJob(jobId, "unknown", "unknown");
      return;
    }

    jobs.value[index].status = status;
  }

  // TODO: Cleanup
  async function addJob(jobId: string, jobName: string, title: string) {
    const job: WorkerJob = {
      jobId,
      workerId: "",
      task: jobName,
      title,
      status: "PENDING",
    };

    jobs.value = [job, ...jobs.value];
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

      switch (payload.event) {
        case "worker:job:created":
          console.log("Job created");
          addJob(payload.jobId, payload.jobName, payload.title); // FIXME
          break;
        case "worker:job:start":
          console.log("Job started");
          updateJobStatus(payload.jobId, "STARTED"); // FIXME
          break;
        case "worker:job:complete":
          console.log("Job completed");
          // TODO: completed event needs to include the new status
          updateJobStatus(payload.jobId, payload.success ? "COMPLETED" : "FAILED"); // FIXME
          break;
      }
    });
  }

  return {
    bindEvents,
    events,
    isConnected,
    jobs,
    jobsLoading,
    jobsError,
    loadJobs,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkerStore, import.meta.hot));
}
