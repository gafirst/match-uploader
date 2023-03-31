import {Path, readFile, writeFile} from "jsonfile";

export async function readSettingsJson<T>(file: Path = "./settings/settings.json"): Promise<T> {
	// Paths are relative to the directory the server is running out of
	return await readFile(file);
}

export async function writeSettingsJson<T>(newJson: T, file: Path = "./settings/settings.json") {
	return await writeFile(file, newJson);
}
