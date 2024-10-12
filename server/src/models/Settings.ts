export interface ISettings {
    eventName: string,
    eventTbaCode: string,
    videoSearchDirectory: string,
    googleClientId: string,
    googleAuthStatus: string,
    playoffsType: string,
    sandboxModeEnabled: boolean,
    youTubeVideoPrivacy: string,
    linkVideosOnTheBlueAlliance: boolean;
    useFrcEventsApi: boolean;
    autoRenameEnabled: boolean;
    autoRenameMinExpectedVideoDurationSecs: string;
    autoRenameMaxExpectedVideoDurationSecs: string;
    autoRenameMaxStartTimeDiffSecStrong: string;
    autoRenameMaxStartTimeDiffSecWeak: string;
    autoRenameFileRenameJobDelaySecs: string;
}

export type SettingsKey = keyof ISettings;

export interface ISecretSettings {
    googleClientSecret: string,
    googleAccessToken: string,
    googleRefreshToken: string,
    googleTokenExpiry: string,
    theBlueAllianceReadApiKey: string,
    theBlueAllianceTrustedApiAuthId: string,
    theBlueAllianceTrustedApiAuthSecret: string,
    frcEventsApiKey: string,
    [key: string]: string,
}

export type SecretSettingsKey = keyof ISecretSettings;

export type ISecretSettingsHidden = {
    // eslint-disable-next-line no-unused-vars
    [key in keyof ISecretSettings]: boolean;
}
