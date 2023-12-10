/**
 * Environments variables declared here.
 */

/* eslint-disable node/no-process-env */

const requiredEnvVars = [
    "HOST",
    "DB_CONNECTION_STRING",
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
    host: process.env.HOST,
    port: Number.parseInt(process.env.PORT ?? "0", 10),
    settingsLocations: {
        settingsFile: (process.env.SETTINGS_FILE_LOCATION) ?? "./settings/settings.json",
        settingsTemplateFile: (process.env.SETTINGS_TEMPLATE_FILE_LOCATION) ?? "./settings/settings.example.json",
        secretsFile: (process.env.SECRETS_FILE_LOCATION) ?? "./settings/secrets.json",
        secretsTemplateFile: (process.env.SECRETS_TEMPLATE_FILE_LOCATION) ?? "./settings/secrets.example.json",
        youTubePlaylistsFile: (process.env.YOUTUBE_PLAYLISTS_FILE_LOCATION) ?? "./settings/playlists.json",
        youTubePlaylistsTemplateFile: (process.env.YOUTUBE_PLAYLISTS_TEMPLATE_FILE_LOCATION) ??
            "./settings/playlists.example.json",
    },
    db: {
        connectionString: process.env.DB_CONNECTION_STRING,
    },
} as const;
