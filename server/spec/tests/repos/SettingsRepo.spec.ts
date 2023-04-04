import * as settingsRepo from '@src/repos/SettingsRepo'
import mockFs from 'mock-fs'

const exampleSettings = {
  'eventName': 'Example Event',
  'eventTbaCode': '2023gacmp',
  'videoSearchDirectory': './videos'
}


describe('opening settings correctly', () => {
  it('should throw an error if there is no example file', async () => {
    mockFs({ settings: {} })
    const settings = settingsRepo.readSettingsJson()
    await expectAsync(settings).toBeRejectedWithError()
    mockFs.restore()
  })

  it('should parse file not found', async () => {
    mockFs({
      'settings': {
        'settings.example.json': JSON.stringify(exampleSettings)
      }
    })

    const settings = await settingsRepo.readSettingsJson()
    expect(settings).toEqual(exampleSettings)
    mockFs.restore()
  })

  it('should parse settings file found', async () => {
    mockFs({
      'settings': {
        'settings.example.json': JSON.stringify(exampleSettings),
        'settings.json': JSON.stringify({
          ...exampleSettings,
          'eventName': 'not example event'
        })
      }
    })

    const settings = await settingsRepo.readSettingsJson()
    expect(settings).toEqual({ ...exampleSettings, 'eventName': 'not example event' })
    mockFs.restore()
  })

})