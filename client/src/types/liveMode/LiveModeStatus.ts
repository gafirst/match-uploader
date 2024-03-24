export enum LiveModeStatus {
  STOPPED = "STOPPED",
  WAITING = "WAITING",
  FETCH_VIDEOS = "FETCH_VIDEOS",
  QUEUE_UPLOADS = "QUEUE_UPLOADS",
  ADVANCE_MATCH = "ADVANCE_MATCH",
  ERROR = "ERROR",
}

export interface LiveModeStatusUiElement {
  text: string;
  color: string;
  icon: string;
}

/**
 * Converts a LiveModeStatus to a string suitable for display in the UI. Will always return a lowercase string, so you
 * may need to adjust capitalization depending on the context.
 */
export function liveModeStatusToUiString(status: LiveModeStatus): LiveModeStatusUiElement {
  const outputMap: Record<LiveModeStatus, LiveModeStatusUiElement> = {
    [LiveModeStatus.STOPPED]: {
      text: "stopped",
      color: "error",
      icon: "mdi-pause-circle-outline",
    },
    [LiveModeStatus.WAITING]: {
      text: "waiting",
      color: "info",
      icon: "mdi-timer-sand",
    },
    [LiveModeStatus.FETCH_VIDEOS]: {
      text: "fetching videos",
      color: "info",
      icon: "mdi-loading mdi-spin",
    },
    [LiveModeStatus.QUEUE_UPLOADS]: {
      text: "queueing uploads",
      color: "info",
      icon: "mdi-loading mdi-spin",
    },
    [LiveModeStatus.ADVANCE_MATCH]: {
      text: "advancing match",
      color: "info",
      icon: "mdi-loading mdi-spin",
    },
    [LiveModeStatus.ERROR]: {
      text: "error",
      color: "error",
      icon: "alert-circle-outline",
    },
  };

  return outputMap[status];
}
