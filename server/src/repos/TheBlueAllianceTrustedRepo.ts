import type MatchKey from "@src/models/MatchKey.ts";
import crypto from "crypto";
import logger from "jet-logger";

export class TheBlueAllianceTrustedRepo {
    private readonly authId: string;
    private readonly authSecret: string;
    private readonly baseDomain = "https://www.thebluealliance.com";
    private readonly basePath = "/api/trusted/v1";
    private readonly baseUrl = `${this.baseDomain}${this.basePath}`;

    constructor(authId: string, authSecret: string) {
        this.authId = authId;
        this.authSecret = authSecret;
    }

    /**
     * Generate the request signature for a request to The Blue Alliance's trusted (write) API.
     * @param path The full URL path excluding the domain, e.g., /api/trusted/v1/event/2014casj/matches/delete
     * @param body The stringified request body
     */
    generateRequestSignature(path: string, body: string): string {
        const hashString = `${this.authSecret}${path}${body}`;
        logger.info(`Generating TBA request signature using hash string ${hashString}}`);
        // This is really easy but anyway: https://odino.org/generating-the-md5-hash-of-a-string-in-nodejs/
        return crypto.createHash("md5").update(hashString).digest("hex");
    }

    /**
     * Make a POST request to The Blue Alliance.
     *
     * Currently, this just checks that the response code is 200 and won't do anything with the response body, if one
     * exists.
     *
     * @param path The path to POST to, NOT including /api/trusted/v1
     * @param body
     * @private
     */
    private async post(path: string, body: object): Promise<void> {
        const stringifiedBody = JSON.stringify(body);
        const fullPath = `${this.basePath}${path}`;
        const fullUrl = `${this.baseUrl}${path}`;
        const result = await fetch(fullUrl, {
            method: "POST",
            body: stringifiedBody,
            headers: {
                "X-TBA-Auth-Id": this.authId,
                "X-TBA-Auth-Sig": this.generateRequestSignature(fullPath, stringifiedBody),
                "Content-Type": "application/json",
                "User-Agent": "gafirst/match-uploader",
            },
        });

        logger.info(`POSTed to ${fullUrl} with body ${stringifiedBody}`);

        if (!result.ok || result.status !== 200) {
            throw new Error(`Error posting to ${path}: ${result.status} ${result.statusText}`);
        }
    }

    async postMatchVideo(matchKey: MatchKey, videoId: string): Promise<void> {
        try {
            await this.post(
                `/event/${matchKey.eventKey}/match_videos/add`,
                {
                    [matchKey.partialMatchKey]: videoId,
                });
        } catch (error) {
            throw new Error("Error posting match videos to The Blue Alliance for " +
                `${matchKey.matchKey} (video ID: ${videoId}: ${error}`);
        }
    }
}
