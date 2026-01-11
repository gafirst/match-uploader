import type { JobHelpers } from "graphile-worker";
import EnvVars from "@src/constants/EnvVars";
import { parse } from "pg-connection-string";
import { DateTime } from "luxon";
import { pgDump, FormatEnum } from "pg-dump-restore";

export async function backupDb(payload: unknown, {
  logger,
}: JobHelpers): Promise<void> {
  if (!EnvVars.db.connectionString) {
    throw new Error("DB connection string is not defined");
  }

  const config = parse(EnvVars.db.connectionString);

  if (!config.host || !config.port || !config.database || !config.user || !config.password) {
    throw new Error("DB connection string is missing required fields");
  }


  const { stdout, stderr } = await pgDump(
    {
      port: parseInt(config.port, 10),
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
