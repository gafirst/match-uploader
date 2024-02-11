/* eslint-disable no-unused-vars */
import { type FrcApiTournamentLevel } from "#src/models/frcEvents/frcTournamentLevel.ts";

/**
 * Represents the competition level of a match.
 */
export enum CompLevel {
    Qualification = "qualification",
    Quarterfinal = "quarterfinal",
    Semifinal = "semifinal",
    Final = "final",
}

/**
 * Given a string, return the corresponding CompLevel.
 *
 * @param compLevelString The abbreviated string representation of a CompLevel
 */
export function compLevelFromString(compLevelString: string): CompLevel {
    switch (compLevelString) {
        case "q":
            return CompLevel.Qualification;
        case "qf":
            return CompLevel.Quarterfinal;
        case "sf":
            return CompLevel.Semifinal;
        case "f":
            return CompLevel.Final;
        default:
            throw new Error(`Comp level ${compLevelString} is invalid.`);
    }
}

/**
 * Given a CompLevel, return it as an abbreviated string, suitable for use in match keys.
 *
 * @param compLevel The CompLevel to abbreviate
 */
export function abbreviatedCompLevel(compLevel: CompLevel): string {
    switch (compLevel) {
        case CompLevel.Qualification:
            return "q";
        case CompLevel.Quarterfinal:
            return "qf";
        case CompLevel.Semifinal:
            return "sf";
        case CompLevel.Final:
            return "f";
        default:
            throw new Error(`Comp level ${compLevel} is invalid.`);
    }
}

export function toFrcApiTournamentLevel(compLevel: CompLevel): FrcApiTournamentLevel {
    switch (compLevel) {
        case CompLevel.Qualification:
            return "qual";
        case CompLevel.Quarterfinal:
            return "playoff";
        case CompLevel.Semifinal:
            return "playoff";
        case CompLevel.Final:
            return "playoff";
        default:
            throw new Error(`Comp level ${compLevel} is invalid.`);
    }
}

export function toFrcEventsUrlTournamentLevel(compLevel: CompLevel): string {
    switch (compLevel) {
        case CompLevel.Qualification:
            return "qualifications";
        case CompLevel.Quarterfinal:
            return "playoffs";
        case CompLevel.Semifinal:
            return "playoffs";
        case CompLevel.Final:
            return "playoffs";
        default:
            throw new Error(`Comp level ${compLevel} is invalid.`);
    }
}
