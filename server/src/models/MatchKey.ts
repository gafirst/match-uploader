import { abbreviatedCompLevel, compareCompLevel, CompLevel, compLevelFromString } from "@src/models/CompLevel";
import { PlayoffsType } from "@src/models/PlayoffsType";
import { getBestOf3RoundNumberFromSetNumber } from "@src/util/playoffs";

class MatchKey {
    year: number;
    eventCode: string;
    compLevel: CompLevel;
    setNumber: number | null;
    matchNumber: number;
    playoffsType: PlayoffsType;

    static matchKeyRegex = /^(\d{4})([a-z0-9]+)_(q|qf|sf|f)(\d{1,2})?m(\d+)$/;

    constructor(
        year: number,
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

    private generateMatchKey(includeEventInfo = true): string {
        // TODO: We should add tests to ensure this value is correct
        const compLevel = abbreviatedCompLevel(this.compLevel);
        const setNumber = this.setNumber ?? "";

        const eventInfo = includeEventInfo ? `${this.year}${this.eventCode}_` : "";

        return `${eventInfo}${compLevel}${setNumber}m${this.matchNumber}`;
    }

    /**
     * Compute the event key for this match. Example: 2020gadal
     */
    get eventKey(): string {
        return `${this.year}${this.eventCode}`;
    }

    /**
     * Get the full match key for this match. Example: 2020gadal_qm1
     */
    get matchKey(): string {
        return this.generateMatchKey(true);
    }

    /**
     * Compute the match number portion of the match key. Used for The Blue Alliance's trusted (write) API, which
     * refers to this as a partial match key.
     * Example: qm1
     */
    get partialMatchKey(): string {
        return this.generateMatchKey(false);
    }

    /**
     * Get the playoff round for this match, if we're able to calculate it.
     *
     * @returns The playoff round, or null if:
     * - The match is a qualification match, or
     * - There is no set number for the match, or
     * - The match is a playoff match, but the playoffs type is not double elimination.
     */
    get playoffsRound(): number | null {
        if (this.playoffsType === PlayoffsType.DoubleElimination && this.compLevel === CompLevel.Semifinal &&
            this.setNumber) {
            return getBestOf3RoundNumberFromSetNumber(this.setNumber);
        }

        return null;
    }

    /**
     * Increment the match key to the next match in the same CompLevel (tournament phase). For instance, if the current
     * MatchKey represents Qualification 1, this function would return Qualification 2.
     *
     * Limitations:
     * - This function is naive and does *not* know if the proposed match actually exists.
     * - This function does not support Best of 3 playoffs currently, as FRC has moved to double eliminations.
     *
     * @return A MatchKey representing the next match within the same CompLevel (tournament phase)
     */
    get nextMatchInSameCompLevel(): MatchKey {
        if (this.compLevel === CompLevel.Qualification) {
            return new MatchKey(this.year,
              this.eventCode,
              abbreviatedCompLevel(this.compLevel),
              null,
              this.matchNumber + 1,
              this.playoffsType,
            );
        }

        if (this.playoffsType !== PlayoffsType.DoubleElimination) {
            throw new Error("Cannot increment match key for non-double elimination playoffs");
        }

        if (this.compLevel === CompLevel.Final) {
            return new MatchKey(
              this.year,
              this.eventCode,
              abbreviatedCompLevel(this.compLevel),
              1,
              this.matchNumber + 1,
              this.playoffsType,
            );
        }

        if (this.compLevel === CompLevel.Semifinal && this.setNumber !== null) {
            return new MatchKey(this.year,
              this.eventCode,
              abbreviatedCompLevel(this.compLevel),
              this.setNumber + 1,
              1,
              this.playoffsType);
        }

        throw new Error(`Cannot increment match key ${this.matchKey}: did not match any recognized scenarios`);
    }

    /**
     * Increment the match key to the first match in the next CompLevel (tournament phase). For instance, if the current
     * MatchKey represents Qualification 1, this function would return Playoff Match 1 (R1).
     *
     * Limitations:
     * - This function is naive and does *not* know if the proposed match actually exists.
     * - This function does not support Best of 3 playoffs currently, as FRC has moved to double eliminations.
     *
     * @return A MatchKey representing the first match in the next CompLevel (tournament phase). If there is no
     *         subsequent CompLevel (e.g., the current MatchKey is a finals match), this function returns null.
     */
    get firstMatchInNextCompLevel(): MatchKey | null {
        if (this.playoffsType !== PlayoffsType.DoubleElimination) {
            throw new Error("Cannot increment match key for non-double elimination playoffs");
        }

        if (this.compLevel === CompLevel.Qualification) {
            return new MatchKey(this.year,
              this.eventCode,
              abbreviatedCompLevel(CompLevel.Semifinal),
              1,
              1,
              this.playoffsType,
            );
        }

        if (this.compLevel === CompLevel.Semifinal) {
            return new MatchKey(this.year,
              this.eventCode,
              abbreviatedCompLevel(CompLevel.Final),
              1,
              1,
              this.playoffsType,
            );
        }

        return null;
    }

    /**
     * Compare two MatchKeys where `a` is this MatchKey and `b` is the other MatchKey to compare to.
     *
     * Returns a positive value if a > b (which means `a` is *later* in the competition compared to `b`), a negative
     * value if a < b (which means `b` is *later* in the competition compared to `a`), and 0 if a === b (which means
     * `a` and `b` are the same competition level).
     *
     * @param b The MatchKey to compare to
     */
    compare(b: MatchKey): number {
        return this.eventKey.localeCompare(b.eventKey)
            || compareCompLevel(this.compLevel, b.compLevel)
            || (this.setNumber ?? 0) - (b.setNumber ?? 0)
            || this.matchNumber - b.matchNumber;
    }
}

export default MatchKey;
