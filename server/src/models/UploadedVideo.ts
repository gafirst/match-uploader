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
