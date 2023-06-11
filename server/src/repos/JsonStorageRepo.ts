import { readFile, writeFile, copyFile } from 'fs/promises';
import { type PathLike } from 'fs';
// eslint-disable-next-line node/no-unsupported-features/node-builtins
import {getSystemErrorName} from "util";
import logger from "jet-logger";

const DEFAULT_ENCODING = 'utf-8';

interface IErrorObj {
  errno: number;
}

function isErrorObj(obj: object): obj is IErrorObj {
  return !!(obj as IErrorObj).errno;
}

function isFileDoesNotExistError(error: unknown): boolean {
  if (error && typeof error === "object" && isErrorObj(error)) {
    return getSystemErrorName(error.errno) === "ENOENT";
  }

  return false;
}

async function readJsonFileContents<T>(filePath: PathLike): Promise<T> {
  return JSON.parse(await readFile(filePath, DEFAULT_ENCODING)) as T;
}

export async function readSettingsJson<T>(filePath: PathLike,
                                          templateFilePath: string | null = null,
): Promise<T> {
  // Paths are relative to the directory the server is running out of
  try {
    return await readJsonFileContents(filePath);
  } catch (error) {
    if (isFileDoesNotExistError(error)) {
      if (templateFilePath) {
        logger.info(`readSettingsJson: ${filePath} does not exist; copied ${templateFilePath} to ${filePath}`);
        await copyFile(templateFilePath, filePath);
        return await readJsonFileContents(filePath);
      } else {
       throw Error(`readSettingsJson: ${filePath} does not exist and no template file was provided`);
      }
    } else {
      throw error;
    }
  }
}

export async function writeSettingsJson<T>(file: PathLike, newJson: T): Promise<void> {
  return await writeFile(file, JSON.stringify(newJson));
}
