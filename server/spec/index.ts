import dotenv from "dotenv";
import find from "find";
import Jasmine from "jasmine";
import { parse } from "ts-command-line-args";
import logger from "jet-logger";

interface IArgs {
  testFile: string;
}

// NOTE: MUST BE FIRST!! Load env vars
const testEnv = dotenv.config({
  path: "./env/test.env",
});
if (testEnv.error) {
  throw testEnv.error;
}

// Setup command line options.
const args = parse<IArgs>({
  testFile: {
    type: String,
    defaultValue: "",
  },
});

const jasmine = new Jasmine();
jasmine.exitOnCompletion = false;

// Set location of test files
jasmine.loadConfig({
  random: true,
  spec_dir: "spec",
  spec_files: [
    "./tests/**/*.spec.ts",
  ],
  stopSpecOnExpectationFailure: false,
});

// Run all or a single unit-test
let execResp;
if (args.testFile) {
  const testFile = args.testFile;
  find.file(testFile + ".spec.ts", "./spec", async (files: string[]) => {
    if (files.length === 1) {
      await jasmine.execute([files[0]]);
    } else {
      logger.err("Test file not found!");
    }
  });
} else {
  execResp = jasmine.execute();
}

// Wait for tests to finish
void (async () => {
  if (!!execResp) {
    const info = await execResp;
    if (info.overallStatus === "passed") {
      logger.info("All tests passed");
    } else {
      logger.err("One or more tests failed");
    }
  }
})();
