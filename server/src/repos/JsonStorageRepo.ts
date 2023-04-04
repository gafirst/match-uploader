import {type Path, readFile, writeFile} from 'jsonfile';

export async function readSettingsJson<T>(file: Path): Promise<T> {
  // Paths are relative to the directory the server is running out of
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await readFile(file);
}

export async function writeSettingsJson<T>(newJson: T, file: Path): Promise<void> {
  return await writeFile(file, newJson);
}
