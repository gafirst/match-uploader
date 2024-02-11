import { type FrcScoredMatch } from "#src/models/frcEvents/frcScoredMatch.ts";

export interface FrcScoredMatchesResponse {
    Matches: FrcScoredMatch[];
}
