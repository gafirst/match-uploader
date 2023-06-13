import type MatchKey from "@src/models/MatchKey";

export class Match {
    key: MatchKey;

    constructor(key: MatchKey) {
        this.key = key;
    }

    get verboseMatchName(): string {
        const fullCompLevel = this.key.compLevel;

        return `${fullCompLevel} ${this.key.matchNumber}`;
    }
}
