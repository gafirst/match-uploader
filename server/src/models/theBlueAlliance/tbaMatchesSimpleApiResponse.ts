import { type TbaAlliance } from "@src/models/theBlueAlliance/tbaAlliance";
import { type TbaWinningAlliance } from "@src/models/theBlueAlliance/tbaWinningAlliance";
import { type TbaCompLevel } from "@src/models/theBlueAlliance/tbaCompLevel";

export type TbaMatchesSimpleApiResponse = TbaMatchSimple[];
export type TbaMatchSimpleApiResponse = TbaMatchSimple;

/**
 * A simple match object from The Blue Alliance API
 *
 * Note that other properties may be included in the response that aren't in this interface; however, only the
 * properties listed in this interface are guaranteed to be present.
 */
export interface TbaMatchSimple {
    actual_time: number | null;
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
