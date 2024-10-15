/* eslint-disable no-unused-vars */
import { type FrcApiTournamentLevel } from "@src/models/frcEvents/frcTournamentLevel";

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

export function compLevelToNumber(compLevel: CompLevel): number {
    switch (compLevel) {
        case CompLevel.Qualification:
            return 0;
        case CompLevel.Quarterfinal:
            return 1;
        case CompLevel.Semifinal:
            return 2;
        case CompLevel.Final:
            return 3;
        default:
            throw new Error(`Comp level ${compLevel} is invalid.`);
    }
}

/**
 * Compare two CompLevels.
 *
 * Returns a positive value if a > b (which means `a` is *later* in the competition compared to `b`), a negative value
 * if a < b (which means `b` is *later* in the competition compared to `a`), and 0 if a === b (which means `a` and `b`
 * are the same competition level).
 *
 * @param a
 * @param b
 */
export function compareCompLevel(a: CompLevel, b: CompLevel): number {
    const aValue = compLevelToNumber(a);
    const bValue = compLevelToNumber(b);

    return aValue - bValue;
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
