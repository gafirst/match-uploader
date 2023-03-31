export interface ISettings {
  eventName: string,
  eventTbaCode: string,
  videoSearchDirectory: string,
  googleClientId: string,
  googleRedirectUri: string,
  googleAuthStatus: string,
  [key: string]: string,
}

export interface ISecretSettings {
  googleClientSecret: string,
  googleAccessToken: string,
  googleRefreshToken: string,
  [key: string]: string,
}

export type SettingType = "setting" | "secret";
