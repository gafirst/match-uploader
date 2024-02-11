/**
 * Remove old files, copy front-end ones.
 */

import fs from "fs-extra";
import childProcess from "node:child_process";
// eslint-disable-next-line node/no-unsupported-features/es-syntax
import _logger  from "jet-logger";
const logger  = _logger as unknown as typeof _logger;

/**
 * Start
 */
try {
  // Remove current build
  await remove("./dist/");
  // Copy front-end files
  await copy("./src/public", "./dist/public");
  // Copy back-end files
  await exec("tsc --build tsconfig.prod.json", "./");
} catch (err) {
  logger.err(err);
  throw new Error("Build failed with errors, see above");
}

/**
 * Remove file
 */
function remove(loc: string): Promise<void> {
  return new Promise((res, rej) => {
    return fs.remove(loc, (err) => {
      return (!!err ? rej(err) : res());
    });
  });
}

/**
 * Copy file.
 */
function copy(src: string, dest: string): Promise<void> {
  return new Promise((res, rej) => {
    return fs.copy(src, dest, (err) => {
      return (!!err ? rej(err) : res());
    });
  });
}

/**
 * Do command line command.
 */
function exec(cmd: string, loc: string): Promise<void> {
  return new Promise((res, rej) => {
    return childProcess.exec(cmd, { cwd: loc }, (err, stdout, stderr) => {
      if (!!stdout) {
        logger.info(stdout);
      }
      if (!!stderr) {
        logger.warn(stderr);
      }
      return (!!err ? rej(err) : res());
    });
  });
}
