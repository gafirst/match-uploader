import { type PathLike } from "fs";
import fastGlob from "fast-glob";
import logger from "jet-logger";

export async function getFilesMatchingPattern(dir: PathLike, pattern: string): Promise<string[]> {
    logger.info(`getFilesMatchingPattern: dir: ${dir}, pattern: ${pattern}`);
    return await fastGlob.async(pattern, {
        cwd: dir.toString(), // cwd is relative to the directory the server is running out of
        onlyFiles: true,
    });
}
