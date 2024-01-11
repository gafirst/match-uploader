import {socket} from "@/socket";
import {acceptHMRUpdate, defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import {
  isWorkerEvent,
  isWorkerJobCompleteEvent, isWorkerJobCreatedEvent,
  isWorkerJobStartEvent, WorkerEvent, WorkerEvents,
  WorkerJob,
  WorkerJobEvent,
  WorkerJobStatus,
} from "@/types/WorkerJob";

export const useWorkerStore = defineStore("worker", () => {
  const isConnected = ref(false);
  const isInitialConnectionPending = ref(true);

  const events = ref<WorkerJobEvent[]>([]);

  watch(isConnected, (newValue) => {
    console.log("isConnected changed to", newValue);
  });

  function addEvent(workerEvent: WorkerEvent, workerJob: WorkerJob) {
    const event: WorkerJobEvent = {
      workerEvent,
      jobId: workerJob.jobId,
    };

    events.value = [event, ...events.value];
  }

  const jobs = ref<Map<string, WorkerJob>>(new Map<string, WorkerJob>());

  const jobsList = computed(() => {
    return Array.from(jobs.value.values());
  });

  const jobsLoading = ref(false);
  const jobsError = ref("");

  const jobCountsByStatus = computed(() => {
    const statsMap = new Map<WorkerJobStatus, number>([
      [WorkerJobStatus.PENDING, 0],
      [WorkerJobStatus.STARTED, 0],
      [WorkerJobStatus.COMPLETED, 0],
      [WorkerJobStatus.FAILED, 0],
      [WorkerJobStatus.FAILED_RETRYABLE, 0],
    ]);

    jobsList.value.forEach((job) => {
      statsMap.set(job.status, (statsMap.get(job.status) ?? 0) + 1);
    });

    return statsMap;
  });

  const numFailedJobs = computed(() => {
    return (jobCountsByStatus.value.get(WorkerJobStatus.FAILED) ?? 0) +
        (jobCountsByStatus.value.get(WorkerJobStatus.FAILED_RETRYABLE) ?? 0);
  });

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

    const jobsResultJson = await jobsResult.json();

    for (const job of jobsResultJson) {
      jobs.value.set(job.jobId, job);
    }

    jobsLoading.value = false;
  }

  // TODO: Maybe this can be simplified
  // TOOD: Better typing
  async function updateJobStatus({
                                   jobId,
                                   attempts,
                                   maxAttempts,
                                   error,
                                   status,
                                   title,
                                   workerId,
                                   task,
                                  linkedOnTheBlueAlliance,
                                  addedToYouTubePlaylist,
                                  youTubeVideoId,
                                 }: WorkerJob) {
    let job = jobs.value.get(jobId);

    if (!job) {
      console.log("Job not found");
      job = await addJob(jobId, jobName, "unknown"); // FIXME
    }

    job.attempts = attempts;
    job.maxAttempts = maxAttempts;
    job.status = status;
    job.title = title;
    job.task = task;
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

      // TODO: support worker:job:created

      if (!isWorkerEvent(payload)) {
        console.log("Ignoring invalid worker event", payload);
        return;
      }

      addEvent(payload.event, payload.workerJob);

      // FIXME: be careful about not regressing job statuses, ex completed -> started
      if (isWorkerJobCreatedEvent(payload)) {
        // FIXME: Update to be more like status update function, or perhaps combine
        await addJob(payload.workerJob.jobId, payload.workerJob.task, payload.workerJob.title);
      } else if (isWorkerJobStartEvent(payload)) {
        await updateJobStatus(payload.workerJob); // FIXME
      } else if (isWorkerJobCompleteEvent(payload)) {
        await updateJobStatus(payload.workerJob); // FIXME
      } else {
        console.log("Ignoring unknown worker event", payload);
      }
    });
  }

  return {
    bindEvents,
    events,
    isConnected,
    jobCountsByStatus,
    jobHasStatus,
    jobs,
    jobsList,
    jobsLoading,
    jobsError,
    loadJobs,
    numFailedJobs,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkerStore, import.meta.hot));
}
