import fs from "fs-extra";
import logger from "jet-logger";
import childProcess from "child_process";

(async () => {
  try {
    const tsconfigEnv = process.argv[2];
    const tsconfigPath = tsconfigEnv === "prod" ? "tsconfig.prod.json" : "tsconfig.json";

    await remove("./dist/");
    await exec(`tsc --build ${tsconfigPath}`, "./");
  } catch (err) {
    logger.err(err);
    throw new Error("Build failed with errors, see above");
  }
})();

function remove(loc: string): Promise<void> {
  return new Promise((res, rej) => {
    return fs.remove(loc, (err) => {
      return (!!err ? rej(err) : res());
    });
  });
}

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
