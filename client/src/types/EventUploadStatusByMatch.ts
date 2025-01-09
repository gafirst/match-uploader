export enum MatchUploadStatus {
  COMPLETED = "COMPLETED",
  PARTIAL = "PARTIAL",
  NOT_STARTED = "NOT_STARTED",
}

export interface UploadStatusSummary {
  matchKey: string;
  matchName: string;
  status: MatchUploadStatus;
  statusByLabel: {
    [label: string]: {
      success: boolean;
      count: number;
      postUploadStepsSucceeded: boolean;
    };
  };
}

export interface UploadTotalsSummary {
  total: number;
  completed: number;
  partial: number;
  notStarted: number;
}

export interface EventUploadStatusByMatch {
  eventKey: string,
  matches: UploadStatusSummary[],
  totals: UploadTotalsSummary,
}

export function isEventUploadStatusByMatch(x: unknown): x is EventUploadStatusByMatch {
  return x !== null &&
    typeof x === "object" &&
    (x as EventUploadStatusByMatch).eventKey !== undefined &&
    Array.isArray((x as EventUploadStatusByMatch).matches) &&
    (x as EventUploadStatusByMatch).totals !== undefined;
}

/**
 * Converts a MatchUploadStatus to a string suitable for display in the UI. Will always return a lowercase string, so
 * you may need to adjust capitalization depending on the context.
 */
export function matchUploadStatusToUiString(status: MatchUploadStatus) {
  const outputMap: Record<MatchUploadStatus, string> = {
    [MatchUploadStatus.COMPLETED]: "completed",
    [MatchUploadStatus.PARTIAL]: "partial",
    [MatchUploadStatus.NOT_STARTED]: "not started",
  };

  return outputMap[status];
}
