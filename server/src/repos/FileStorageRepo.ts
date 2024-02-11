import { type PathLike } from "fs";
import fastGlob from "fast-glob";
import logger from "jet-logger";
import { isFileDoesNotExistError } from "#src/util/file.ts";
import { copyFile, readFile, writeFile } from "fs/promises";

const DEFAULT_ENCODING = "utf-8";

export async function getFilesMatchingPattern(dir: PathLike, pattern: string): Promise<string[]> {
    logger.info(`getFilesMatchingPattern: dir: ${dir}, pattern: ${pattern}`);
    return await fastGlob.async(pattern, {
        cwd: dir.toString(), // cwd is relative to the directory the server is running out of
        onlyFiles: true,
    });
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

async function readTextFileContents(filePath: PathLike): Promise<string> {
    return await readFile(filePath, DEFAULT_ENCODING);
}

export async function readTextFile(filePath: PathLike, templateFilePath: string | null = null): Promise<string> {
    // Paths are relative to the directory the server is running out of
    try {
        return await readTextFileContents(filePath);
    } catch (error) {
        if (isFileDoesNotExistError(error)) {
            if (templateFilePath) {
                logger.info(`readTextFile: ${filePath} does not exist; copied ${templateFilePath} to ${filePath}`);
                await copyFile(templateFilePath, filePath);
                return await readTextFileContents(filePath);
            } else {
                throw Error(`readTextFile: ${filePath} does not exist and no template file was provided`);
            }
        } else {
            throw error;
        }
    }
}

export async function writeTextFile(file: PathLike, newText: string): Promise<void> {
    return await writeFile(file, newText);
}
