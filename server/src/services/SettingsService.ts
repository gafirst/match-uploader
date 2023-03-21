import {ISetting, ISettings} from "@src/models/Settings";
import {readSettingsJson, writeSettingsJson} from "@src/repos/JsonStorageRepo";

export async function getSettings(): Promise<ISettings> {
	return await readSettingsJson<ISettings>();
}

export async function setSetting(key: string, value: string): Promise<void> {
	const currentSettings = await getSettings();

	return await writeSettingsJson<ISettings>({
		...currentSettings,
		[key]: value,
	})
}
