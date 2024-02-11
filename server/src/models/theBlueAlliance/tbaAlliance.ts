import { type TbaFrcTeam } from "#src/models/theBlueAlliance/tbaFrcTeam.ts";

export interface TbaAlliance {
    dq_team_keys: TbaFrcTeam[];
    score: number | null;
    surrogate_team_keys?: TbaFrcTeam[];
    team_keys: TbaFrcTeam[];
}
