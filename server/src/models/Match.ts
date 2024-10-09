import type MatchKey from "@src/models/MatchKey";
import { compareCompLevel, CompLevel } from "@src/models/CompLevel";
import { capitalizeFirstLetter } from "@src/util/string";

export class Match {
  key: MatchKey;
  isReplay: boolean;

  constructor(key: MatchKey, isReplay: boolean = false) {
    this.key = key;
    this.isReplay = isReplay;
  }

  /**
   * Generate a human-readable name for this match.
   * @param includeMatch Whether to include the word "Match" or not
   * @param includeDoubleElimRound
   * @returns The match name
   * @private
   */
  private generateMatchName(includeMatch: boolean, includeDoubleElimRound: boolean): string {
    const match = includeMatch ? "Match " : "";
    const replay = this.isReplay ? " Replay" : "";

    const fullCompLevel = this.key.compLevel;

    const playoffsRound = this.key.playoffsRound;
    if (playoffsRound) {
      const round = includeDoubleElimRound ? ` (R${playoffsRound})` : "";
      return `Playoff ${match}${this.key.setNumber}${round}${replay}`;
    }

    if (this.key.setNumber) {
      if (fullCompLevel === CompLevel.Final) {
        return `${capitalizeFirstLetter(fullCompLevel)} ${match}${this.key.matchNumber}${replay}`;
      }

      return `${capitalizeFirstLetter(fullCompLevel)} ${this.key.setNumber} ${match}${this.key.matchNumber}${replay}`;
    }

    return `${capitalizeFirstLetter(fullCompLevel)} ${match}${this.key.matchNumber}${replay}`;
  }

  get matchName(): string {
    return this.generateMatchName(false, true);
  }

  get videoFileMatchingName(): string {
    return this.generateMatchName(false, false);
  }

  get verboseMatchName(): string {
    return this.generateMatchName(true, true);
  }

  /**
   * Determine if this match is after another match.
   *
   * Will return true if this match occurs later in the competition than the other match.
   * If an identical match is passed in, this will return false.
   *
   * @param other
   */
  isAfter(other: Match): boolean {
    const compLevelComparison = compareCompLevel(this.key.compLevel, other.key.compLevel);

    if (compLevelComparison === 0) {
      if (this.key.compLevel === CompLevel.Qualification) {
        return this.key.matchNumber > other.key.matchNumber;
      }

      if (this.key.setNumber === other.key.setNumber) {
        return this.key.matchNumber > other.key.matchNumber;
      }

      return (this.key.setNumber ?? 0) > (other.key.setNumber ?? 0);
    }

    return compLevelComparison > 0;
  }
}
