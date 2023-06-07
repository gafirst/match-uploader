import {
  type ISecretSettingsHidden,
  type ISecretSettings,
  type ISettings,
  type SettingsKey,
  type SecretSettingsKey,
} from '@src/models/Settings';
import {readSettingsJson, writeSettingsJson} from '@src/repos/JsonStorageRepo';
import EnvVars from '@src/constants/EnvVars';

export async function getSettings(): Promise<ISettings> {
  return await readSettingsJson<ISettings>(EnvVars.SettingsLocations.SettingsFile);
}

export async function setSetting(key: SettingsKey, value: string): Promise<void> {
  const currentSettings = await getSettings();

  return await writeSettingsJson<ISettings>(EnvVars.SettingsLocations.SettingsFile, {
    ...currentSettings,
    [key]: value,
  });
}

export async function getSecrets(): Promise<ISecretSettings> {
  return await readSettingsJson<ISecretSettings>(EnvVars.SettingsLocations.SecretsFile);
}

export async function getObfuscatedSecrets(): Promise<ISecretSettingsHidden> {
  const secrets = await getSecrets();

  const result: ISecretSettingsHidden = {
    googleClientSecret: false,
    googleAccessToken: false,
    googleRefreshToken: false,
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
