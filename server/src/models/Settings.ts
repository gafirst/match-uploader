export interface ISettings {
    eventName: string,
    eventTbaCode: string,
    videoSearchDirectory: string,
    googleClientId: string,
    googleAuthStatus: string,
}

export type SettingsKey = keyof ISettings;

export interface ISecretSettings {
    googleClientSecret: string,
    googleAccessToken: string,
    googleRefreshToken: string,
    [key: string]: string,
}

export type SecretSettingsKey = keyof ISecretSettings;

export type ISecretSettingsHidden = {
    // eslint-disable-next-line no-unused-vars
    [key in keyof ISecretSettings]: boolean;
}
