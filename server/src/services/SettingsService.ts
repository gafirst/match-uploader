import {ISetting, ISettings} from "@src/models/Settings";
import {readSettingsJson, writeSettingsJson} from "@src/repos/SettingsRepo";

export async function getSettings(): Promise<ISettings> {
	return await readSettingsJson();
}

export async function setSetting(key: string, value: string): Promise<void> {
	const currentSettings = await getSettings();

	return await writeSettingsJson({
		...currentSettings,
		[key]: value,
	})
}
