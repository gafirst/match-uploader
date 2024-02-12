import { getSystemErrorName } from "util";

interface IErrorObj {
  errno: number;
}

function isErrorObj(obj: object): obj is IErrorObj {
  return !!(obj as IErrorObj).errno;
}

export function isFileDoesNotExistError(error: unknown): boolean {
  if (error && typeof error === "object" && isErrorObj(error)) {
    return getSystemErrorName(error.errno) === "ENOENT";
  }

  return false;
}
