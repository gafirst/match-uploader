import { type FrcTeam } from "#src/models/frcEvents/frcTeam.ts";
import { type TbaMatchSimple } from "#src/models/theBlueAlliance/tbaMatchesSimpleApiResponse.ts";
import { type TbaWinningAlliance } from "#src/models/theBlueAlliance/tbaWinningAlliance.ts";
import { type TbaCompLevel } from "#src/models/theBlueAlliance/tbaCompLevel.ts";
import { CompLevel } from "#src/models/CompLevel.ts";

export interface FrcScoredMatch {
    tournamentLevel: string;
    matchNumber: number;
    scoreRedFinal: number | null | undefined;
    scoreBlueFinal: number | null | undefined
    teams: FrcTeam[];
}

export function isFrcScoredMatch(obj: object): obj is FrcScoredMatch {
    return !!(obj as FrcScoredMatch).tournamentLevel &&
        !!(obj as FrcScoredMatch).matchNumber &&
        !!(obj as FrcScoredMatch).teams;
}

function convertMatchWinnerToTba(redScore: number | null | undefined,
                                 blueScore: number | null | undefined): TbaWinningAlliance {
    if (redScore === null ||
        blueScore === null ||
        typeof redScore === "undefined" ||
        typeof blueScore === "undefined" ||
        redScore === blueScore
    ) {
        return "";
    }
    if (redScore > blueScore) {
        return "red";
    }

    return "blue";
}

/**
 * Coerce tournament level and match number from FRC Events into a TBA competition level.
 *
 * NOTE: This function doesn't support Best of 3 currently.
 * @param tournamentLevel
 * @param matchNumber
 */
function getTbaCompLevel(tournamentLevel: string, matchNumber: number): TbaCompLevel {
    if (tournamentLevel === "Qualification") {
        return "qm";
    }

    // This is assuming double elimination, for simplicity
    if (tournamentLevel === "Playoff") {
        if (matchNumber <= 13) {
            return "sf";
        }

        return "f";
    }

    throw new Error(`getTbaCompLevel: Tournament level ${tournamentLevel} is not supported.`);
}

/**
 * Coerce tournament level and match number from FRC Events into a TBA set number.
 *
 * NOTE: This function doesn't support Best of 3 currently.
 * @param tournamentLevel
 * @param matchNumber
 */
function getTbaSetNumber(tournamentLevel: string, matchNumber: number): number {
    if (tournamentLevel === "Qualification") {
        return 1;
    }

    // This is assuming double elimination, for simplicity
    if (tournamentLevel === "Playoff") {
        // On TBA, matches 1-3 in double elimination are sf#m1
        if (matchNumber <= 13) {
            return matchNumber;
        }

        // Matchs 14+ are finals, which only has 1 set
        return 1;
    }

    throw new Error(`getTbaSetNumber: Tournament level ${tournamentLevel} is not supported.`);
}

/**
 * Coerce tournament level and match number from FRC Events into a TBA match key.
 *
 * NOTE: This function doesn't support Best of 3 currently.
 * @param match
 * @param eventKey
 */
function getTbaMatchKey(match: FrcScoredMatch, eventKey: string): string {
    if (match.tournamentLevel === "Qualification") {
        return `${eventKey}_qm${match.matchNumber}`;
    }

    if (match.tournamentLevel === "Playoff") {
        const compLevel = getTbaCompLevel(match.tournamentLevel, match.matchNumber);
        const setNumber = getTbaSetNumber(match.tournamentLevel, match.matchNumber);

        let actualMatchNumber = match.matchNumber;

        // Handle finals matches, which FRC Events numbers starting at 14 but TBA numbers starting at 1
        if (match.matchNumber > 13) {
            actualMatchNumber -= 13;
        } else {
            // The double elimination matches for rounds 1-5 have 1-13 as their set number, while the match
            // number is always one
            actualMatchNumber = 1;
        }

        return `${eventKey}_${compLevel}${setNumber}m${actualMatchNumber}`;
    }

    throw new Error(`getTbaMatchKey: Tournament level ${match.tournamentLevel} is not supported.`);
}

/**
 * Coerce tournament level and match number into a TBA match key.
 * @param year
 * @param eventCode
 */
function getTbaEventKey(year: string, eventCode: string): string {
    return `${year}${eventCode}`;
}

/**
 * Coerce a FrcScoredMatch to a TbaMatchSimple.
 *
 * NOTE: This function doesn't support Best of 3 currently.
 * @param match
 * @param year
 * @param eventCode
 */
export function asTbaMatchSimple(match: FrcScoredMatch, year: string, eventCode: string): TbaMatchSimple {
    const eventKey = getTbaEventKey(year, eventCode);
    return {
        alliances: {
            blue: {
                score: match.scoreBlueFinal ?? null,
                team_keys: match.teams.filter(team =>
                    team.station.includes("Blue"),
                ).map(team => `frc${team.teamNumber}`),
                dq_team_keys: match.teams.filter(team =>
                    team.station.includes("Blue") && team.dq,
                ).map(team => `frc${team.teamNumber}`),
            },
            red: {
                score: match.scoreRedFinal ?? null,
                team_keys: match.teams.filter(team =>
                    team.station.includes("Red"),
                ).map(team => `frc${team.teamNumber}`),
                dq_team_keys: match.teams.filter(team =>
                    team.station.includes("Red") && team.dq,
                ).map(team => `frc${team.teamNumber}`),
            },
        },
        comp_level: getTbaCompLevel(match.tournamentLevel, match.matchNumber),
        match_number: match.matchNumber,
        set_number: getTbaSetNumber(match.tournamentLevel, match.matchNumber),
        winning_alliance: convertMatchWinnerToTba(match.scoreRedFinal, match.scoreBlueFinal),
        event_key: eventKey,
        key: getTbaMatchKey(match, eventKey),
    };
}

export function getFrcApiMatchNumber(compLevel: CompLevel, setNumber: number | null, matchNumber: number): number {
    if (compLevel === CompLevel.Qualification) {
        return matchNumber;
    }

    // In double elimination, set number is the match number for the first 5 rounds
    if (compLevel === CompLevel.Semifinal) {
        if (!setNumber) {
            throw new Error(`getFrcApiMatchNumber: setNumber cannot be null for ${compLevel} (note ` +
                "that this function only works for events using double elims)");
        }

        return setNumber;
    }

    // In double elimination, the finals match numbers start at 14 (1 + 13)
    if (compLevel === CompLevel.Final) {
        return matchNumber + 13;
    }

    throw new Error(`getFrcApiMatchNumber: CompLevel ${compLevel} is not supported.`);
}
