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
  [key: string]: string | boolean,
}

export type SettingType = "setting" | "secret";
