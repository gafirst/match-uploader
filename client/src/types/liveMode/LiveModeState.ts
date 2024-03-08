export const LM_SETUP = "LM_SETUP";
export const LM_WAIT = "LM_WAIT";
export const LM_REFRESH = "LM_REFRESH";
export const LM_QUEUE = "LM_QUEUE";
export const LM_INCREMENT = "LM_INCREMENT";


export type LiveModeState = typeof LM_SETUP
  | typeof LM_WAIT
  | typeof LM_REFRESH
  | typeof LM_QUEUE
  | typeof LM_INCREMENT;
