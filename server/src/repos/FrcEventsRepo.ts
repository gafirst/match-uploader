import {
    type TbaMatchesSimpleApiResponse,
    type TbaMatchSimple,
} from "@src/models/theBlueAlliance/tbaMatchesSimpleApiResponse";
import { isObject } from "@src/util/isObject";
import { type FrcScoredMatchesResponse } from "@src/models/frcEvents/frcScoredMatchesResponse";
import { asTbaMatchSimple, getFrcApiMatchNumber, isFrcScoredMatch } from "@src/models/frcEvents/frcScoredMatch";
import logger from "jet-logger";
import { type FrcApiTournamentLevel } from "@src/models/frcEvents/frcTournamentLevel";
import type MatchKey from "@src/models/MatchKey";
import { toFrcApiTournamentLevel } from "@src/models/CompLevel";

export class FrcEventsRepo {
    private readonly apiKey: string;
    private readonly baseUrl = "https://frc-api.firstinspires.org/v3.0";

    /**
     *
     * @param apiKey The base64-encoded Basic authentication API key to use with the FRC Events API
     *
     */
    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async get<T extends object>(path: string, typeValidator: (x: unknown) => x is T): Promise<T> {
        const url = `${this.baseUrl}/${path}`;
        const result = await fetch(url, {
            headers: {
                Authorization: `Basic ${this.apiKey}`,
                "Content-Type": "application/json",
                "User-Agent": "gafirst/match-uploader",
            },
        });

        if (!result.ok) {
            logger.err(`Error fetching ${url}: ${result.status} ${result.statusText}:`);
            logger.err(await result.text());
            throw new Error(`Error fetching ${url}: ${result.status} ${result.statusText}`);
        }

        const data: unknown = await result.json();

        if (!typeValidator(data)) {
            throw new Error(`Error fetching ${url}: response did not match expected type`);
        }

        return data;
    }

    private async getScoredMatchesForTournamentLevel(year: string,
                                                     eventCode: string,
                                                     tournamentLevel: FrcApiTournamentLevel,
    ): Promise<TbaMatchSimple[]> {
        try {
            const result = await this.get(
                `${year}/matches/${eventCode}?tournamentLevel=${tournamentLevel}`,
                (elem): elem is FrcScoredMatchesResponse =>
                    isObject(elem) &&
                    !!(elem as FrcScoredMatchesResponse).Matches &&
                    Array.isArray((elem as FrcScoredMatchesResponse).Matches) &&
                    (elem as FrcScoredMatchesResponse).Matches.every(isObject) &&
                    (elem as FrcScoredMatchesResponse).Matches.every(isFrcScoredMatch),
            );

            return result.Matches.map((match) => {
                return asTbaMatchSimple(match, year, eventCode);
            });
        } catch (error) {
            throw new Error(`Error fetching scored matches from FRC Events for ${year}${eventCode}: ${error}`);
        }
    }

    /**
     * Get scored matches for this event.
     *
     * Only returns qualification and playoff matches. Does not support best of 3 elimination matches.
     *
     * @param year The year associated with the event, e.g., 2023 for 2023gadal
     * @param eventCode The event code, e.g., gadal for 2023gadal
     */
    async getScoredMatches(year: string, eventCode: string): Promise<TbaMatchesSimpleApiResponse> {
        const [qualMatches, playoffMatches] = await Promise.all([
            this.getScoredMatchesForTournamentLevel(year, eventCode, "qual"),
            this.getScoredMatchesForTournamentLevel(year, eventCode, "playoff"),
        ]);

        return qualMatches.concat(playoffMatches);
    }

    async getScoredMatch(year: string, eventCode: string, matchKey: MatchKey): Promise<TbaMatchSimple> {
        const tournamentLevel = toFrcApiTournamentLevel(matchKey.compLevel);
        const matchNumber = getFrcApiMatchNumber(matchKey.compLevel, matchKey.setNumber, matchKey.matchNumber);

        try {
            const result = await this.get(
                `${year}/matches/${eventCode}?tournamentLevel=${tournamentLevel}&matchNumber=${matchNumber}`,
                (elem): elem is FrcScoredMatchesResponse =>
                    isObject(elem) &&
                    !!(elem as FrcScoredMatchesResponse).Matches &&
                    Array.isArray((elem as FrcScoredMatchesResponse).Matches) &&
                    (elem as FrcScoredMatchesResponse).Matches.every(isObject) &&
                    (elem as FrcScoredMatchesResponse).Matches.every(isFrcScoredMatch),
            );

            // For some reason, the API response still has entries for every match even when matchNumber is specified;
            // the irrelevant entries have the import details nulled out and the response is returned much faster
            // though. Anyways, we can get around this easily enough using `find`
            const match = result.Matches.find(match => match.matchNumber === matchNumber);

            if (!match) {
                throw new Error(`Match ${matchNumber} not found `);
            }

            return asTbaMatchSimple(match, year, eventCode);
        } catch (error) {
            throw new Error("getScoredMatch: Error fetching scored matches from FRC Events for " +
                `${year}${eventCode}: ${error}`);
        }
    }
}
