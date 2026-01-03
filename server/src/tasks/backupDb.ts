import type { JobHelpers } from "graphile-worker";
import EnvVars from "@src/constants/EnvVars";
import { parse } from "pg-connection-string";
import { DateTime } from "luxon";
import { FormatEnum } from "pg-dump-restore";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pgDumpRestore = require("pg-dump-restore");

export async function backupDb(payload: unknown, {
  logger,
}: JobHelpers): Promise<void> {
  if (!EnvVars.db.connectionString) {
    throw new Error("DB connection string is not defined");
  }

  const config = parse(EnvVars.db.connectionString)

  const { stdout, stderr } = await pgDumpRestore.pgDump(
    {
      port: config.port,
      host: config.host,
      database: config.database,
      username: config.user,
      password: config.password,
    },
    {
      filePath: `./videos/dump-${DateTime.now().toISO({ suppressSeconds: true }).replaceAll(":", "_")}.sql`,
      format: FormatEnum.Plain,
    },
  );
  logger.info(stdout);
  logger.error(stderr);
}
