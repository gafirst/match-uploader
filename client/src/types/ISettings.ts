export interface ISettings {
  eventName: string,
  eventTbaCode: string,
  videoSearchDirectory: string,
  googleClientId: string,
  googleRedirectUri: string,
  googleAuthStatus: string,
  [key: string]: string,
}

export type SettingType = "setting" | "secret";
