import type MatchKey from "@src/models/MatchKey";
import { CompLevel } from "@src/models/CompLevel";

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
                return `${fullCompLevel} ${match}${this.key.matchNumber}${replay}`;
            }

            return `${fullCompLevel} ${this.key.setNumber} ${match}${this.key.matchNumber}${replay}`;
        }

        return `${fullCompLevel} ${match}${this.key.matchNumber}${replay}`;
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
