import {socket} from "@/socket";
import {acceptHMRUpdate, defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import {WorkerJobStatus} from "@/types/WorkerJob";
import {success} from "semantic-release-major-tag";

// TODO: types in separate file
type WorkerEvent = "worker:job:created" | "worker:job:start" | "worker:job:complete" | "unknown";

interface WorkerJobEvent {
  jobId: string;
  event: WorkerEvent;
  jobName: string;
  statusDescription: string;
}

interface WorkerJob {
  jobId: string;
  workerId: string | null;
  task: string;
  title: string;
  status: WorkerJobStatus;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  youTubeVideoId: string | null;
  addedToYouTubePlaylist: boolean | null;
  linkedOnTheBlueAlliance: boolean | null;
}

export const useWorkerStore = defineStore("worker", () => {
  const isConnected = ref(false);
  const isInitialConnectionPending = ref(true);

  const events = ref<WorkerJobEvent[]>([]);

  watch(isConnected, (newValue) => {
    console.log("isConnected changed to", newValue);
  });

  // FIXME
  function addEvent(data: any) {
    if (!data || !data.event || !data.jobId || !data.jobName) {
      return;
    }

    const event: WorkerJobEvent = {
      event: data.event || "unknown",
      jobName: data.jobName,
      jobId: data.jobId,
      statusDescription: data.success ? "success" : "error",
    };

    events.value = [event, ...events.value];
  }

  const jobs = ref<Map<string, WorkerJob>>(new Map<string, WorkerJob>());

  const jobsList = computed(() => {
    return Array.from(jobs.value.values());
  });

  const jobsLoading = ref(false);
  const jobsError = ref("");

  /**
   * Return the job's current status if it exists, otherwise return false
   *
   * @param jobId
   * @param status
   */
  function jobHasStatus(jobId: string | null, status: WorkerJobStatus): boolean {
    if (!jobId) {
      return false;
    }

    const job = jobs.value.get(jobId);

    if (!job) {
      return false;
    }

    return job.status === status;
  }

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

    const jobsResultJson = await jobsResult.json(); // TODO: check type
    const jobsMap = new Map<string, WorkerJob>();

    for (const job of jobsResultJson) {
      jobsMap.set(job.jobId, job);
    }

    jobs.value = jobsMap;
    jobsLoading.value = false;
  }

  // TODO: Maybe this can be simplified
  // TOOD: Better typing
  async function updateJobStatus({
                                   jobId,
                                   jobName,
                                   attempts,
                                   maxAttempts,
                                   error,
                                   status,
                                   title,
                                   workerId,
                                  linkedOnTheBlueAlliance,
                                  addedToYouTubePlaylist,
                                  youTubeVideoId,
                                 }: {
    jobId: string,
    jobName: string,
    title: string,
    workerId: string,
    attempts: number,
    maxAttempts: number,
    status: WorkerJobStatus
    youTubeVideoId: string | null,
    addedToYouTubePlaylist: boolean | null,
    linkedOnTheBlueAlliance: boolean | null,
    error: string | null,
  }) {
    let job = jobs.value.get(jobId);

    if (!job) {
      console.log("Job not found");
      job = await addJob(jobId, jobName, "unknown");
    }

    job.attempts = attempts;
    job.maxAttempts = maxAttempts;
    job.status = status;
    job.title = title;
    job.workerId = workerId;
    job.youTubeVideoId = youTubeVideoId;
    job.addedToYouTubePlaylist = addedToYouTubePlaylist;
    job.linkedOnTheBlueAlliance = linkedOnTheBlueAlliance;
    job.error = error;
  }

  // TODO: Cleanup
  async function addJob(jobId: string, jobName: string, title: string): Promise<WorkerJob> {
    const job: WorkerJob = {
      jobId,
      workerId: null,
      task: jobName,
      title,
      status: WorkerJobStatus.PENDING,
      attempts: 0,
      maxAttempts: 0, // FIXME
      error: null,
      addedToYouTubePlaylist: null,
      linkedOnTheBlueAlliance: null,
      youTubeVideoId: null,
    };

    jobs.value.set(jobId, job);
    return job;
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

    // TODO: type checking through socketio
    socket.on("worker", async (payload) => {
      console.log(`worker | event: ${payload.event}`, payload);
      addEvent(payload);

      switch (payload.event) {
        case "worker:job:created":
          console.log("Job created");
          await addJob(payload.workerJob.jobId, payload.workerJob.jobName, payload.workerJob.title); // FIXME: Update to be more like status update function, or perhaps combine
          break;
        case "worker:job:start":
          console.log("Job started");
          await updateJobStatus(payload.workerJob); // FIXME: Update function since it just accepts the netire payload
          break;
        case "worker:job:complete":
          console.log("Job completed");
          await updateJobStatus(payload.workerJob); // FIXME
          break;
      }
    });
  }

  return {
    bindEvents,
    events,
    isConnected,
    jobHasStatus,
    jobs,
    jobsList,
    jobsLoading,
    jobsError,
    loadJobs,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkerStore, import.meta.hot));
}
