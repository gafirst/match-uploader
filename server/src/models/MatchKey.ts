import {abbreviatedCompLevel, CompLevel, compLevelFromString} from "@src/models/CompLevel";
import {PlayoffsType} from "@src/models/PlayoffsType";
import {getBestOf3RoundNumberFromSetNumber} from "@src/util/playoffs";

class MatchKey {
    year: number;
    eventCode: string;
    compLevel: CompLevel;
    setNumber: number | null;
    matchNumber: number;
    playoffsType: PlayoffsType;

    static matchKeyRegex = /^(\d{4})([a-z]+)_(q|qf|sf|f)(\d{1,2})?m(\d+)$/;

    constructor(year: number,
                eventCode: string,
                compLevel: string,
                setNumber: number | null,
                matchNumber: number,
                playoffsType: PlayoffsType,
    ) {
        this.year = year;
        this.eventCode = eventCode;
        this.compLevel = compLevelFromString(compLevel);
        this.setNumber = setNumber;
        this.matchNumber = matchNumber;
        this.playoffsType = playoffsType;
    }

    static fromString(matchKey: string, playoffsType: PlayoffsType): MatchKey {
        return this.parseMatchKey(matchKey, playoffsType);
    }

    private static parseMatchKey(matchKey: string, playoffsType: PlayoffsType): MatchKey {
        const matchInfoCaptures = matchKey.match(this.matchKeyRegex);
        if (matchInfoCaptures === null) {
            throw new Error(`Match key ${matchKey} is invalid.`);
        }

        // Note that the first capture group is the entire match key, so we start at index 1.
        return new MatchKey(
            parseInt(matchInfoCaptures[1], 10),
            matchInfoCaptures[2],
            matchInfoCaptures[3],
            matchInfoCaptures[4] === undefined ? null : parseInt(matchInfoCaptures[4], 10),
            parseInt(matchInfoCaptures[5], 10),
            playoffsType,
        );
    }

    get matchKey(): string {
        // TODO: We should add tests to ensure this value is correct
        const compLevel = abbreviatedCompLevel(this.compLevel);
        const setNumber = this.setNumber === null ? "" : this.setNumber;

        return `${this.year}${this.eventCode}_${compLevel}${setNumber}m${this.matchNumber}`;
    }

    /**
     * Get the playoff round for this match, if we're able to calculate it.
     *
     * @returns The playoff round, or null if:
     * - The match is a qualification match
     * - There is no set number for the match
     * - The match is a playoff match, but the playoffs type is not double elimination
     */
    get playoffsRound(): number | null {
        if (this.playoffsType === PlayoffsType.DoubleElimination && this.compLevel === CompLevel.Semifinal &&
            this.setNumber) {
            return getBestOf3RoundNumberFromSetNumber(this.setNumber);
        }

        return null;
    }
}

export default MatchKey;
