export const UPLOAD_VIDEO = "uploadVideo";
export type AUTO_RENAME = "autoRename";
export type RENAME_FILE = "renameFile";
export type WorkerTask = typeof UPLOAD_VIDEO | AUTO_RENAME | RENAME_FILE;
