import * as fs from 'fs/promises' // Moved away from node-jsonfile since it seemed tiny and does not have code coverage reports
import { ISettings } from '@src/models/Settings'
import { getSystemErrorName } from 'util'

export async function readSettingsJson(): Promise<ISettings> {
	// Paths are relative to the directory the server is running out of
	try {
		return JSON.parse(await fs.readFile('./settings/settings.json', 'utf-8'))
	} catch (e: any) {
		if (getSystemErrorName(e.errno) === 'ENOENT') {
			console.warn('settings.json not found! Reading example settings file...')
			return JSON.parse(await fs.readFile('./settings/settings.example.json', 'utf-8'))
		} else {
			throw e
		}
	}
}

export async function writeSettingsJson(newSettings: ISettings) {
	return await fs.writeFile('./settings/settings.json', JSON.stringify(newSettings));
}
