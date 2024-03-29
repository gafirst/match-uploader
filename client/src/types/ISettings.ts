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
  [key: string]: string | boolean,
}

export type SettingType = "setting" | "secret";
