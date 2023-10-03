import {isTbaMatchSimple, type TbaMatchSimpleApiResponse} from "@src/models/theBlueAlliance/tbaMatchSimpleApiResponse";
import {isObject} from "@src/util/isObject";
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

    async getEventMatches(eventKey: string): Promise<TbaMatchSimpleApiResponse> {
        try {
            return await this.get(
                `event/${eventKey}/matches/simple`,
                (x): x is TbaMatchSimpleApiResponse =>
                    Array.isArray(x) &&
                    x.every(isObject) &&
                    x.every(isTbaMatchSimple));
        } catch (e) {
            throw new Error(`Error fetching event matches for ${eventKey}: ${e}`);
        }
    }
}
