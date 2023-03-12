import {Path, readFile, writeFile} from "jsonfile";
import {ISettings} from "@src/models/Settings";

export async function readSettingsJson(): Promise<ISettings> {
	// Paths are relative to the directory the server is running out of
	return await readFile("./settings/settings.json");
}

export async function writeSettingsJson(newSettings: ISettings) {
	return await writeFile("./settings/settings.json", newSettings);
}
