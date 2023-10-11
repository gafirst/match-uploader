import {
  type ISecretSettings,
  type ISecretSettingsHidden,
  type ISettings,
  type SecretSettingsKey,
  type SettingsKey,
} from "@src/models/Settings";
import {readSettingsJson, writeSettingsJson} from "@src/repos/JsonStorageRepo";
import EnvVars from "@src/constants/EnvVars";
import {type YouTubePlaylists} from "@src/models/YouTubePlaylists";

export async function getSettings(): Promise<ISettings> {
  return await readSettingsJson<ISettings>(
      EnvVars.SettingsLocations.SettingsFile,
      EnvVars.SettingsLocations.SettingsTemplateFile,
  );
}

export async function setSetting(key: SettingsKey, value: string): Promise<void> {
  const currentSettings = await getSettings();

  let valueToSave: string | boolean = value;

  // Coerce string boolean values to actual boolean types
  if (value === "true" || value === "false") {
    valueToSave = !!JSON.parse(value);
  }

  return await writeSettingsJson<ISettings>(EnvVars.SettingsLocations.SettingsFile, {
    ...currentSettings,
    [key]: valueToSave,
  });
}

export async function getSecrets(): Promise<ISecretSettings> {
  return await readSettingsJson<ISecretSettings>(
      EnvVars.SettingsLocations.SecretsFile,
      EnvVars.SettingsLocations.SecretsTemplateFile,
  );
}

export async function getObfuscatedSecrets(): Promise<ISecretSettingsHidden> {
  const secrets = await getSecrets();

  const result: ISecretSettingsHidden = {
    googleClientSecret: false,
    googleAccessToken: false,
    googleRefreshToken: false,
    theBlueAllianceReadApiKey: false,
  };

  for (const key in secrets) {
    const value = secrets[key];

    result[key] = !!value;
  }

  return result;
}

export async function setSecret(key: SecretSettingsKey, value: string): Promise<void> {
  const currentSecrets = await getSecrets();

  return await writeSettingsJson<ISecretSettings>(EnvVars.SettingsLocations.SecretsFile, {
    ...currentSecrets,
    [key]: value,
  });
}

export async function getYouTubePlaylists(): Promise<YouTubePlaylists> {
  return await readSettingsJson<YouTubePlaylists>(
      EnvVars.SettingsLocations.YouTubePlaylistsFile,
      EnvVars.SettingsLocations.YouTubePlaylistsTemplateFile,
  );
}

export async function setYouTubePlaylist(videoLabel: string,
                                         playlistId: string,
                                         playlistName: string | null = null): Promise<void> {
    const currentPlaylists = await getYouTubePlaylists();

    return await writeSettingsJson<YouTubePlaylists>(EnvVars.SettingsLocations.YouTubePlaylistsFile, {
        ...currentPlaylists,
        [videoLabel]: {
          id: playlistId,
          name: playlistName,
        },
    });
}
