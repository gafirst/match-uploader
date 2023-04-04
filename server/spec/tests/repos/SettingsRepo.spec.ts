import * as settingsRepo from '@src/repos/SettingsRepo'
import mock from 'mock-fs'

const exampleSettings = {
  'eventName': 'Example Event',
  'eventTbaCode': '2023gacmp',
  'videoSearchDirectory': './videos'
}


describe('opening settings correctly', () => {
  it('should throw an error if there is no example file', async () => {
    mock({ settings: {} })
    const settings = settingsRepo.readSettingsJson()
    await expectAsync(settings).toBeRejectedWithError()
    mock.restore()
  })

  it('should parse file not found', async () => {
    mock({
      'settings': {
        'settings.example.json': JSON.stringify(exampleSettings)
      }
    })

    const settings = await settingsRepo.readSettingsJson()
    expect(settings).toEqual(exampleSettings)
    mock.restore()
  })

  it('should parse settings file found', async () => {
    mock({
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
    mock.restore()
  })

})