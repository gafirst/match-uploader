export interface CronPayload {
    ts: string;
    backfill: boolean;
}

export function assertIsCronPayload(payload: unknown): asserts payload is CronPayload {
  if (payload === null) {
    throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
  } else if (typeof payload === "undefined") {
    throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
  } else if (!(payload as unknown as CronPayload).ts ||
    (payload as unknown as CronPayload).backfill === null
  ) {
    throw new Error(`Invalid payload (missing required prop): ${JSON.stringify(payload)}`);
  }
}
