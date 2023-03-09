import * as fs from 'fs/promises'

async function locateFile(folder: string, match: string): Promise<string | undefined> {
  const files = await fs.readdir(folder, { withFileTypes: true })

  const all: Promise<string | undefined>[] = []

  // asynchronously recursively check every subdir of the specified dir
  // GITHUB COPILOT WAS QUITE INCOMPETENT AND I HAD TO MANUALLY DO THIS -K
  for (const file of files) {
    if (file.isDirectory()) {
      console.log('checking: ' + file.name)
      all.push(locateFile(`${folder}/${file.name}`, match))
    } else if (file.name === match) {
      return `${folder}/${file.name}`
    }
  }

  for (const r of (await Promise.all(all))) {
    if (r) return r
  }
}
