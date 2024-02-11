import {
    type ISecretSettings,
    type ISecretSettingsHidden,
    type ISettings,
    type SecretSettingsKey,
    type SettingsKey,
} from "#src/models/Settings.ts";
import EnvVars from "#src/constants/EnvVars.ts";
import { type YouTubePlaylists } from "#src/models/YouTubePlaylists.ts";
import { readSettingsJson, readTextFile, writeSettingsJson, writeTextFile } from "#src/repos/FileStorageRepo.ts";

export async function getSettings(): Promise<ISettings> {
  return await readSettingsJson<ISettings>(
      EnvVars.settingsLocations.settingsFile,
      EnvVars.settingsLocations.settingsTemplateFile,
  );
}

export async function setSetting(key: SettingsKey, value: string): Promise<void> {
  const currentSettings = await getSettings();

  let valueToSave: string | boolean = value;

  // Coerce string boolean values to actual boolean types
  if (value === "true" || value === "false") {
    valueToSave = !!JSON.parse(value);
  }

  return await writeSettingsJson<ISettings>(EnvVars.settingsLocations.settingsFile, {
    ...currentSettings,
    [key]: valueToSave,
  });
}

export async function getSecrets(): Promise<ISecretSettings> {
  return await readSettingsJson<ISecretSettings>(
      EnvVars.settingsLocations.secretsFile,
      EnvVars.settingsLocations.secretsTemplateFile,
  );
}

export async function getObfuscatedSecrets(): Promise<ISecretSettingsHidden> {
  const secrets = await getSecrets();

  const result: ISecretSettingsHidden = {
    googleClientSecret: false,
    googleAccessToken: false,
    googleRefreshToken: false,
    googleTokenExpiry: false,
    theBlueAllianceReadApiKey: false,
    theBlueAllianceTrustedApiAuthId: false,
    theBlueAllianceTrustedApiAuthSecret: false,
    frcEventsApiKey: false,
  };

  for (const key in secrets) {
    const value = secrets[key];

    result[key] = !!value;
  }

  return result;
}

export async function setSecret(key: SecretSettingsKey, value: string): Promise<void> {
  const currentSecrets = await getSecrets();

  return await writeSettingsJson<ISecretSettings>(EnvVars.settingsLocations.secretsFile, {
    ...currentSecrets,
    [key]: value,
  });
}

export async function getYouTubePlaylists(): Promise<YouTubePlaylists> {
  return await readSettingsJson<YouTubePlaylists>(
      EnvVars.settingsLocations.youTubePlaylistsFile,
      EnvVars.settingsLocations.youTubePlaylistsTemplateFile,
  );
}

export async function setYouTubePlaylist(videoLabel: string,
                                         playlistId: string,
                                         playlistName: string | null = null): Promise<void> {
    const currentPlaylists = await getYouTubePlaylists();

    return await writeSettingsJson<YouTubePlaylists>(EnvVars.settingsLocations.youTubePlaylistsFile, {
        ...currentPlaylists,
        [videoLabel]: {
          id: playlistId,
          name: playlistName,
        },
    });
}

export async function deleteYouTubePlaylistMapping(videoLabel: string): Promise<void> {
  const currentPlaylists = await getYouTubePlaylists();

  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete currentPlaylists[videoLabel];

  return await writeSettingsJson<YouTubePlaylists>(EnvVars.settingsLocations.youTubePlaylistsFile, currentPlaylists);
}

export async function getDescriptionTemplate(): Promise<string> {
  return await readTextFile(
      EnvVars.settingsLocations.youTubeDescriptionFile,
      EnvVars.settingsLocations.youTubeDescriptionTemplateFile,
  );
}

export async function setDescriptionTemplate(descriptionTemplate: string): Promise<void> {
  return await writeTextFile(EnvVars.settingsLocations.youTubeDescriptionFile, descriptionTemplate);
}
