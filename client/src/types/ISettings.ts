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

export type SettingType = "setting" | "secret";
