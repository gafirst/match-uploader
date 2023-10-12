import type MatchKey from "@src/models/MatchKey";
import {CompLevel} from "@src/models/CompLevel";

export class Match {
    key: MatchKey;

    constructor(key: MatchKey) {
        this.key = key;
    }

    /**
     * Generate a human-readable name for this match.
     * @param includeMatch Whether to include the word "Match" or not
     * @returns The match name
     * @private
     */
    private generateMatchName(includeMatch: boolean, includeDoubleElimRound: boolean): string {
        const match = includeMatch ? "Match " : "";

        const fullCompLevel = this.key.compLevel;

        const playoffsRound = this.key.playoffsRound;
        if (playoffsRound) {
            const round = includeDoubleElimRound ? ` (R${playoffsRound})` : "";
            return `Playoff ${match}${this.key.setNumber}${round}`;
        }

        if (this.key.setNumber) {
            if (fullCompLevel === CompLevel.Final) {
                return `${fullCompLevel} ${match}${this.key.matchNumber}`;
            }

            return `${fullCompLevel} ${this.key.setNumber} ${match}${this.key.matchNumber}`;
        }

        return `${fullCompLevel} ${match}${this.key.matchNumber}`;
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
}
