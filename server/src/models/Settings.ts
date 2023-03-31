export interface IJsonSettings {
	[key: string]: any
}

export interface ISettings {
	eventName: string,
	eventTbaCode: string,
	videoSearchDirectory: string,
	googleClientId: string,
	googleRedirectUri: string,
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
	[key in keyof ISecretSettings]: boolean;
}
