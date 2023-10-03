import logger from "jet-logger";
import { CompLevel, compLevelFromString } from "@src/models/CompLevel";
import { getSettings } from "@src/services/SettingsService";
import { PlayoffsType } from "@src/models/PlayoffsType";
import { getBestOf3RoundNumberFromSetNumber } from "@src/util/playoffs";

class MatchKey {
    year: number;
    eventCode: string;
    compLevel: CompLevel;
    setNumber: number | null;
    matchNumber: number;

    static matchKeyRegex = /^(\d{4})([a-z]+)_(q|qf|sf|f)(\d{1,2})?m(\d+)$/;

    constructor(year: number, eventCode: string, compLevel: string, setNumber: number | null, matchNumber: number) {
        this.year = year;
        this.eventCode = eventCode;
        this.compLevel = compLevelFromString(compLevel);
        this.setNumber = setNumber;
        this.matchNumber = matchNumber;
    }

    static fromString(matchKey: string): MatchKey {
        return this.parseMatchKey(matchKey);
    }

    private static parseMatchKey(matchKey: string): MatchKey {
        const matchInfoCaptures = matchKey.match(this.matchKeyRegex);
        if (matchInfoCaptures === null) {
            throw new Error(`Match key ${matchKey} is invalid.`);
        }
        logger.info(matchInfoCaptures);

        // Note that the first capture group is the entire match key, so we start at index 1.
        return new MatchKey(
            parseInt(matchInfoCaptures[1], 10),
            matchInfoCaptures[2],
            matchInfoCaptures[3],
            matchInfoCaptures[4] === undefined ? null : parseInt(matchInfoCaptures[3], 10),
            parseInt(matchInfoCaptures[5], 10),
        );
    }

    get matchKey(): string {
        return `${this.year}${this.eventCode}_${this.compLevel}${this.setNumber}m${this.matchNumber}`;
    }

    /**
     * Get the playoff round for this match, if we're able to calculate it.
     *
     * @returns The playoff round, or null if:
     * - The match is a qualification match
     * - There is no set number for the match
     * - The match is a playoff match, but the playoffs type is not double elimination
     */
    async playoffRound(): Promise<number | null> {
        const { playoffsType } = await getSettings();
        if (this.compLevel === CompLevel.Qualification) {
            return null;
        }

        if (!this.setNumber) {
            return null;
        }

        if (playoffsType !== PlayoffsType.DoubleElimination) {
            return null;
        }

        return getBestOf3RoundNumberFromSetNumber(this.setNumber);
    }
}

export default MatchKey;
