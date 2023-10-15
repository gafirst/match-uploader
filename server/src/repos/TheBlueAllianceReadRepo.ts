import type MatchKey from "@src/models/MatchKey";
import {
    isTbaMatchSimple,
    type TbaMatchesSimpleApiResponse,
    type TbaMatchSimpleApiResponse,
} from "@src/models/theBlueAlliance/tbaMatchesSimpleApiResponse";
import { isObject } from "@src/util/isObject";
import fetch from "node-fetch";

export class TheBlueAllianceReadRepo {
    private readonly apiKey: string;
    private readonly baseUrl = "https://www.thebluealliance.com/api/v3";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async get<T extends object>(path: string, typeValidator: (x: unknown) => x is T): Promise<T> {
        const result = await fetch(`${this.baseUrl}/${path}`, {
            headers: {
                "X-TBA-Auth-Key": this.apiKey,
                "Content-Type": "application/json",
                "User-Agent": "gafirst/match-uploader",
            },
        });

        if (!result.ok) {
            throw new Error(`Error fetching ${path}: ${result.status} ${result.statusText}`);
        }

        const data: unknown = await result.json();

        if (!typeValidator(data)) {
            throw new Error(`Error fetching ${path}: response did not match expected type`);
        }

        return data;
    }

    async getEventMatches(eventKey: string): Promise<TbaMatchesSimpleApiResponse> {
        try {
            return await this.get(
                `event/${eventKey}/matches/simple`,
                (elem): elem is TbaMatchesSimpleApiResponse =>
                    Array.isArray(elem) &&
                    elem.every(isObject) &&
                    elem.every(isTbaMatchSimple),
            );
        } catch (error) {
            throw new Error(`Error fetching event matches from The Blue Alliance for ${eventKey}: ${error}`);
        }
    }

    async getMatchResults(matchKey: MatchKey): Promise<TbaMatchSimpleApiResponse> {
        try {
            return await this.get(
                `/match/${matchKey.matchKey}/simple`,
                (elem): elem is TbaMatchSimpleApiResponse => isObject(elem) && isTbaMatchSimple(elem),
            );
        } catch (error) {
            throw new Error("Error fetching simple match results from The Blue Alliance for " +
                `${matchKey.matchKey}: ${error}`);
        }
    }
}
