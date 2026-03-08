import Sentry from "@sentry/node";
import { Job, Worker } from "graphile-worker";

function getPropIfPresent(obj: unknown, propName: string): unknown {
  try {
    // @ts-expect-error If obj is not actually an object or doesn't have the property, this will throw an error, but
    // it's fine because this is in a try-catch
    return obj[propName];
  } catch {
    return null;
  }
}

export function recordJobAttemptMetric(eventName: string, worker: Worker, job: Job, error: string | null = null) {
  Sentry.withScope(scope => {
    scope.setAttributes({
      jobId: job.id,
      jobAttempt: job.attempts,
      jobMaxAttempts: job.max_attempts,
      jobName: job.task_identifier,
      worker: worker.workerId,
      eventKey: getPropIfPresent(job.payload, "eventKey"),
      matchKey: getPropIfPresent(job.payload, "matchKey"),
      error,
      success: !error ? "true" : "false",
    });


    Sentry.metrics.count(eventName, 1);
    Sentry.metrics.distribution(`${eventName}_time_since_creation_msecs`,
      Math.max(0, new Date().getTime() - job.created_at.getTime()),
      {
        unit: "millisecond",
      });
  });
}