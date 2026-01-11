import { getSystemErrorName } from "util";
import fsPromises from "fs/promises";

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

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fsPromises.stat(filePath);
    return stats.isFile();
  } catch (e: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return false;
  }
}
