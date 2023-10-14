/**
 * Environments variables declared here.
 */

/* eslint-disable node/no-process-env */

if (!process.env.HOST) {
  throw Error("HOST environment variable must be set");
}

export default {
  NodeEnv: (process.env.NODE_ENV ?? ""),
  Host: (process.env.HOST),
  Port: (process.env.PORT ?? 0),
  SettingsLocations: {
    SettingsFile: (process.env.SETTINGS_FILE_LOCATION) ?? "./settings/settings.json",
    SettingsTemplateFile: (process.env.SETTINGS_TEMPLATE_FILE_LOCATION) ?? "./settings/settings.example.json",
    SecretsFile: (process.env.SECRETS_FILE_LOCATION) ?? "./settings/secrets.json",
    SecretsTemplateFile: (process.env.SECRETS_TEMPLATE_FILE_LOCATION) ?? "./settings/secrets.example.json",
    YouTubePlaylistsFile: (process.env.YOUTUBE_PLAYLISTS_FILE_LOCATION) ?? "./settings/playlists.json",
    YouTubePlaylistsTemplateFile: (process.env.YOUTUBE_PLAYLISTS_TEMPLATE_FILE_LOCATION) ??
        "./settings/playlists.example.json",
  },
  CookieProps: {
    Key: "ExpressGeneratorTs",
    Secret: (process.env.COOKIE_SECRET ?? ""),
    // Casing to match express cookie options
    Options: {
      httpOnly: true,
      signed: true,
      path: (process.env.COOKIE_PATH ?? ""),
      maxAge: Number(process.env.COOKIE_EXP ?? 0),
      domain: (process.env.COOKIE_DOMAIN ?? ""),
      secure: (process.env.SECURE_COOKIE === "true"),
    },
  },
  Jwt: {
    Secret: (process.env.JWT_SECRET ?? ""),
    Exp: (process.env.COOKIE_EXP ?? ""), // exp at the same time as the cookie
  },
} as const;
