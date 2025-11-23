/**
 * Environments variables declared here.
 */

const requiredEnvVars = [
    "HOST",
    "DB_CONNECTION_STRING",
    "WORKER_WEB_SERVER_URL",
];

// Print all missing env vars
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    throw Error(
        `Unable to start because some required environment variables are not defined: ${missingEnvVars.join(", ")}`,
    );
}

export default {
    nodeEnv: process.env.NODE_ENV ?? "",
    version: process.env.RELEASE_VERSION,
    host: process.env.HOST,
    port: Number.parseInt(process.env.PORT ?? "0", 10),
    spellCheck: {
      dictBasePath: (process.env.SPELLCHECK_DICT_BASE_PATH) ?? "./node_modules/typo-js/dictionaries",
    },
    settingsLocations: {
        youTubeDescriptionFile: process.env.DESCRIPTIONS_FILE_LOCATION ?? "./settings/description.txt",
        youTubeDescriptionTemplateFile: process.env.DESCRIPTIONS_TEMPLATE_FILE_LOCATION ??
          "./settings/description.example.txt",
        settingsFile: process.env.SETTINGS_FILE_LOCATION ?? "./settings/settings.json",
        settingsTemplateFile: process.env.SETTINGS_TEMPLATE_FILE_LOCATION ?? "./settings/settings.example.json",
        secretsFile: process.env.SECRETS_FILE_LOCATION ?? "./settings/secrets.json",
        secretsTemplateFile: process.env.SECRETS_TEMPLATE_FILE_LOCATION ?? "./settings/secrets.example.json",
        youTubePlaylistsFile: process.env.YOUTUBE_PLAYLISTS_FILE_LOCATION ?? "./settings/playlists.json",
        youTubePlaylistsTemplateFile: process.env.YOUTUBE_PLAYLISTS_TEMPLATE_FILE_LOCATION ??
            "./settings/playlists.example.json",
    },
    db: {
        connectionString: process.env.DB_CONNECTION_STRING,
    },
    sentry: {
      enabled: (process.env.SENTRY_ENABLED || "").toLowerCase() === "true",
      dsn: process.env.SENTRY_DSN,
    },
    worker: {
        webServerUrl: process.env.WORKER_WEB_SERVER_URL ?? "",
        crontabFilePath: process.env.CRONTAB_FILE_PATH ?? "./dist/crontab.txt",
    },
} as const;
