import {PlayoffMatchType} from "@/types/MatchType";

export interface ISettings {
  eventName: string,
  eventTbaCode: string,
  videoSearchDirectory: string,
  playoffsType: PlayoffMatchType,
  googleClientId: string,
  googleRedirectUri: string,
  googleAuthStatus: string,
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
  autoRenameFileNamePatterns: string;
  [key: string]: string | boolean,
}

export type SettingNamespace = "rawSettings" | "descriptionTemplate" | "obfuscatedSecrets";
export type SettingType = "setting" | "secret";

interface ISettingClientValue<T> {
  currentValue: T;
  proposedValue: T;
  error?: string;
}

export interface ISettingsClient {
  eventName: ISettingClientValue<string>,
  eventTbaCode: ISettingClientValue<string>,
  videoSearchDirectory: ISettingClientValue<string>,
  playoffsType: ISettingClientValue<PlayoffMatchType>,
  googleClientId: ISettingClientValue<string>,
  googleRedirectUri: ISettingClientValue<string>,
  googleAuthStatus: ISettingClientValue<string>,
  sandboxModeEnabled: ISettingClientValue<boolean>,
  youTubeVideoPrivacy: ISettingClientValue<string>,
  linkVideosOnTheBlueAlliance: ISettingClientValue<boolean>,
  useFrcEventsApi: ISettingClientValue<boolean>,
  autoRenameEnabled: ISettingClientValue<boolean>,
  autoRenameMinExpectedVideoDurationSecs: ISettingClientValue<string>,
  autoRenameMaxExpectedVideoDurationSecs: ISettingClientValue<string>,
  autoRenameMaxStartTimeDiffSecStrong: ISettingClientValue<string>,
  autoRenameMaxStartTimeDiffSecWeak: ISettingClientValue<string>,
  autoRenameFileRenameJobDelaySecs: ISettingClientValue<string>,
  autoRenameFileNamePatterns: ISettingClientValue<string>,
  [key: string]: ISettingClientValue<any>,
}

export interface SaveSettingResult {
  success: boolean;
  error?: string;
}
