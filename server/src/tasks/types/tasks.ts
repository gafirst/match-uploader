export const UPLOAD_VIDEO = "uploadVideo";
export const AUTO_RENAME = "autoRename";
export const RENAME_FILE = "renameFile";
export type WorkerTask = typeof UPLOAD_VIDEO | typeof AUTO_RENAME | typeof RENAME_FILE;
