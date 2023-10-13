import {type TbaAlliance} from "@src/models/theBlueAlliance/tbaAlliance";
import {type TbaWinningAlliance} from "@src/models/theBlueAlliance/tbaWinningAlliance";
import {type TbaCompLevel} from "@src/models/theBlueAlliance/tbaCompLevel";

export type TbaMatchesSimpleApiResponse = TbaMatchSimple[];
export type TbaMatchSimpleApiResponse = TbaMatchSimple;

export interface TbaMatchSimple {
    alliances: {
        blue: TbaAlliance;
        red: TbaAlliance;
    },
    comp_level: TbaCompLevel;
    match_number: number;
    set_number: number;
    winning_alliance: TbaWinningAlliance;
    event_key: string;
    key: string;
}

export function isTbaMatchSimple(obj: object): obj is TbaMatchSimple {
    return !!(obj as TbaMatchSimple).alliances &&
        !!(obj as TbaMatchSimple).comp_level &&
        !!(obj as TbaMatchSimple).match_number &&
        !!(obj as TbaMatchSimple).set_number &&
        !!(obj as TbaMatchSimple).event_key &&
        !!(obj as TbaMatchSimple).key;
}
