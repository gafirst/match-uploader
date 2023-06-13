import {PlayoffMatchType} from "@/types/MatchType";

export interface ISettings {
  eventName: string,
  eventTbaCode: string,
  videoSearchDirectory: string,
  playoffsType: PlayoffMatchType,
  googleClientId: string,
  googleRedirectUri: string,
  googleAuthStatus: string,
  [key: string]: string,
}

export type SettingType = "setting" | "secret";
