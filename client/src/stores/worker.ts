import {socket} from "@/socket";
import {acceptHMRUpdate, defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import {
  isWorkerEvent,
  isWorkerJobCompleteEvent, isWorkerJobCreatedEvent,
  isWorkerJobStartEvent, WORKER_JOB_CREATED, WorkerEvent, WorkerEvents,
  WorkerJob,
  WorkerJobEvent,
  WorkerJobStatus, workerJobStatusAsNumber,
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

  function jobUpdatedAtSortDirection(job1Status: WorkerJobStatus, job2Status: WorkerJobStatus): number {
    if (job1Status === job2Status) {
      // Statuses to show the oldest jobs first
      const sortAscending = [WorkerJobStatus.PENDING, WorkerJobStatus.STARTED,  WorkerJobStatus.FAILED_RETRYABLE];
      if (sortAscending.includes(job1Status)) {
        return 1;
      }

      return -1;
    }

    return 0;
  }

  const jobsListAsQueue = computed(() => {
    return jobsList.value.sort((job1: WorkerJob, job2: WorkerJob) => {
      return workerJobStatusAsNumber(job1.status) - workerJobStatusAsNumber(job2.status) ||
        ((new Date(job1.updatedAt).getTime() - new Date(job2.updatedAt).getTime()) *
          jobUpdatedAtSortDirection(job1.status, job2.status));
    });
  });

  const jobsLoading = ref(false);
  const jobsError = ref("");

  function jobsInStatus(statuses: WorkerJobStatus | WorkerJobStatus[]) {
    if (!Array.isArray(statuses)) {
      statuses = [statuses];
    }

    return jobsList.value.filter((job) => statuses.includes(job.status));
  }

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
    return (jobCountsByStatus.value.get(WorkerJobStatus.FAILED) ?? 0);
  });

  /**
   * Return the job's current status if it exists, otherwise return false
   *
   * @param jobId
   * @param status
   */
  function jobHasStatus(jobId: string | null, status: WorkerJobStatus | WorkerJobStatus[]): boolean {
    if (!Array.isArray(status)) {
      status = [status];
    }

    if (!jobId) {
      return false;
    }

    const job = jobs.value.get(jobId);
    if (!job) {
      return false;
    }

    return status.includes(job.status);
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

  async function createOrUpdateJob(event: WorkerEvent, workerJob: WorkerJob) {
    let storedJob = jobs.value.get(workerJob.jobId);

    if (!storedJob) {
      addJob(workerJob);
      storedJob = jobs.value.get(workerJob.jobId);
    }

    // Don't update if the job status transition would be invalid (e.g., completed -> started, failed -> started)
    if (storedJob && storedJob.status === WorkerJobStatus.COMPLETED && workerJob.status === WorkerJobStatus.STARTED) {
      console.warn(`Ignoring ${event} event because of invalid status transition: completed -> started`, {
        storedJob, workerJob,
      });
      return;
    }

    console.log("Stored job.status", storedJob?.status, "workerJob.status", workerJob.status, "event", event);
    if (storedJob && storedJob.status === WorkerJobStatus.STARTED && workerJob.status === WorkerJobStatus.PENDING) {
      console.warn(`Ignoring ${event} event because of invalid status transition: started -> pending`, {
        storedJob, workerJob,
      });
      return;
    }

    if (storedJob && storedJob.status === WorkerJobStatus.FAILED && workerJob.status === WorkerJobStatus.STARTED) {
      console.warn(`Ignoring ${event} event because of invalid status transition: failed -> started`, {
        storedJob, workerJob,
      });
      return;
    }

    if (storedJob && storedJob.status === WorkerJobStatus.COMPLETED && workerJob.status === WorkerJobStatus.FAILED) {
      console.warn(`Ignoring ${event} event because of invalid status transition: completed -> failed`, {
        storedJob, workerJob,
      });
      return;
    }

    addEvent(event, workerJob);
    jobs.value.set(workerJob.jobId, workerJob);
  }

  function addJob(workerJob: WorkerJob) {
    jobs.value.set(workerJob.jobId, workerJob);
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

    socket.on("worker", async (payload) => {
      if (!isWorkerEvent(payload)) {
        console.warn("Ignoring invalid worker event", payload);
        return;
      }

      if (isWorkerJobCreatedEvent(payload) || isWorkerJobStartEvent(payload) || isWorkerJobCompleteEvent(payload)) {
        console.log(`Worker event: ${payload.event}`, payload);
        await createOrUpdateJob(payload.event, payload.workerJob);
      } else {
        console.warn("Ignoring unknown worker event", payload);
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
    jobsError,
    jobsList,
    jobsListAsQueue,
    jobsLoading,
    jobsInStatus,
    loadJobs,
    numFailedJobs,
  };
});

// Enable Pinia's hot module replacement feature
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkerStore, import.meta.hot));
}
