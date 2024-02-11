import type MatchKey from "#src/models/MatchKey.ts";
import { getFilesMatchingPattern } from "#src/repos/FileStorageRepo.ts";
import { getDescriptionTemplate, getSecrets, getSettings } from "#src/services/SettingsService.ts";
import { Match } from "#src/models/Match.ts";
import { capitalizeFirstLetter } from "#src/util/string.ts";
import { MatchVideoInfo } from "#src/models/MatchVideoInfo.ts";
import { type TbaMatchSimple } from "#src/models/theBlueAlliance/tbaMatchesSimpleApiResponse.ts";
import { TheBlueAllianceReadRepo } from "#src/repos/TheBlueAllianceReadRepo.ts";
import { type TbaFrcTeam } from "#src/models/theBlueAlliance/tbaFrcTeam.ts";
import { FrcEventsRepo } from "#src/repos/FrcEventsRepo.ts";
import { PlayoffsType } from "#src/models/PlayoffsType.ts";
import { getFrcApiMatchNumber } from "#src/models/frcEvents/frcScoredMatch.ts";
import { CompLevel, toFrcEventsUrlTournamentLevel } from "#src/models/CompLevel.ts";
import logger from "jet-logger";
import Mustache from "mustache";

export async function getLocalVideoFilesForMatch(matchKey: MatchKey): Promise<MatchVideoInfo[]> {
    const { eventName, videoSearchDirectory } = await getSettings();
    const match = new Match(matchKey);
    const videoFileMatchingName = capitalizeFirstLetter(match.videoFileMatchingName);
    const matchTitleName = capitalizeFirstLetter(match.verboseMatchName);

    const files = await getFilesMatchingPattern(videoSearchDirectory, `${videoFileMatchingName}*`);
    const parseVideoLabelsRegex = /^[A-Za-z]+ (\d{1,3})\s?([A-Za-z\s]*)\..*$/;

    return files.filter(file => {
        const proposedVideoLabel = parseVideoLabelsRegex.exec(file);

        // Filter out this file if the pattern is incorrect
        if (!proposedVideoLabel || proposedVideoLabel.length < 3) {
            return false;
        }

        // Pulls the actual match number out of the file name using the 2nd capture group in parseVideoLabelsRegex
        const fileMatchNumber = proposedVideoLabel[1];

        if (!fileMatchNumber) {
            return false;
        }

        // In double eliminations, playoff matches (before finals) have their sequence number in the set number, not
        // the match number
        if (match.key.playoffsType === PlayoffsType.DoubleElimination && match.key.compLevel === CompLevel.Semifinal) {
            return Number.parseInt(fileMatchNumber, 10) === match.key.setNumber;
        }

        // Otherwise, check that when parsed as a number, the match number in the file name matches the match for which
        // we are finding videos
        return Number.parseInt(fileMatchNumber, 10) === match.key.matchNumber;
    }).map((file) => {
        const proposedVideoLabel = parseVideoLabelsRegex.exec(file);
        let videoLabel: string | null = null;
        let videoTitle: string;

        if (proposedVideoLabel !== null && proposedVideoLabel.length >= 3 && proposedVideoLabel[2] !== "") {
            videoLabel = proposedVideoLabel[2];
        }

        if (!videoLabel) {
            videoTitle = `${matchTitleName} - ${eventName}`;
        } else {
            videoTitle = `${matchTitleName} - ${videoLabel} - ${eventName}`;
        }

        return new MatchVideoInfo(file, videoLabel, videoTitle);
    });
}

export async function getTbaMatchList(): Promise<TbaMatchSimple[]> {
    const { eventTbaCode } = await getSettings();
    const { theBlueAllianceReadApiKey } = await getSecrets();
    const tba = new TheBlueAllianceReadRepo(theBlueAllianceReadApiKey);

    return await tba.getEventMatches(eventTbaCode);
}

export async function getFrcEventsMatchList(): Promise<TbaMatchSimple[]> {
    const { eventTbaCode } = await getSettings();

    const year = eventTbaCode.substring(0, 4);
    const eventCode = eventTbaCode.substring(4);

    const { frcEventsApiKey } = await getSecrets();
    const frc = new FrcEventsRepo(frcEventsApiKey);

    return await frc.getScoredMatches(year, eventCode);
}

export async function getMatchList(): Promise<TbaMatchSimple[]> {
    const { useFrcEventsApi } = await getSettings();

    if (useFrcEventsApi) {
        return await getFrcEventsMatchList();
    }

    return await getTbaMatchList();
}

export async function getTbaMatch(matchKey: MatchKey): Promise<TbaMatchSimple> {
    const { theBlueAllianceReadApiKey } = await getSecrets();
    const tba = new TheBlueAllianceReadRepo(theBlueAllianceReadApiKey);

    return await tba.getMatchResults(matchKey);
}

export async function getFrcEventsMatch(matchKey: MatchKey): Promise<TbaMatchSimple> {
    const { eventTbaCode } = await getSettings();

    const year = eventTbaCode.substring(0, 4);
    const eventCode = eventTbaCode.substring(4);

    const { frcEventsApiKey } = await getSecrets();
    const frc = new FrcEventsRepo(frcEventsApiKey);

    return await frc.getScoredMatch(year, eventCode, matchKey);
}

export async function getMatch(matchKey: MatchKey): Promise<TbaMatchSimple> {
    const { useFrcEventsApi } = await getSettings();

    if (useFrcEventsApi) {
        return await getFrcEventsMatch(matchKey);
    }

    return await getTbaMatch(matchKey);
}

/**
 * Determine if a match is scored. A match is scored if both alliances have a score greater than or equal to 0 set.
 * @param match The match object resulting from calling the TBA API using TheBlueAllianceReadRepo
 * @returns boolean True if the match has been scored, false otherwise.
 */
function matchIsScored(match: TbaMatchSimple): boolean {
    return (match.alliances.red.score ?? -1) >= 0 && (match.alliances.blue.score ?? -1) >= 0;
}

/**
 * Get a string of team numbers from a list of team keys from The Blue Alliance.
 * @param teamKeys A list of team keys from The Blue Alliance
 * @param joinWith A string to join the team numbers with. Defaults to ", ".
 * @returns string A string of team numbers, joined by the joinWith string.
 */
function getTeamsInMatch(teamKeys: TbaFrcTeam[], joinWith = ", "): string {
    // turns "frc1234" into "1234"
    return teamKeys.map((teamKey) => teamKey.substring(3)).join(joinWith);
}

async function generateMatchDetailsUrl(matchKey: MatchKey): Promise<{
    url: string,
    site: "The Blue Alliance" | "FRC Events",
}> {
    const { eventTbaCode, useFrcEventsApi } = await getSettings();
    const year = eventTbaCode.substring(0, 4);
    const eventCode = eventTbaCode.substring(4);

    if (useFrcEventsApi) {
        if (matchKey.playoffsType !== PlayoffsType.DoubleElimination) {
            throw new Error(`When using FRC Events as a data source, best of 3 matches are not supported.`);
        }

        const matchNumber = getFrcApiMatchNumber(matchKey.compLevel, matchKey.setNumber, matchKey.matchNumber);
        const tournamentLevel = toFrcEventsUrlTournamentLevel(matchKey.compLevel);
        return {
            url: `https://frc-events.firstinspires.org/${year}/${eventCode}/${tournamentLevel}/${matchNumber}`,
            site: "FRC Events",
        };
    }

    return {
        url: `https://thebluealliance.com/match/${matchKey.matchKey}`,
        site: "The Blue Alliance",
    };
}

export async function generateMatchVideoDescription(match: Match, eventName: string): Promise<string> {
    const templateString = await getDescriptionTemplate();
    logger.info(templateString);

    const matchKey = match.key;
    const matchInfo = await getMatch(matchKey);

    if (!matchIsScored(matchInfo)) {
        throw new Error(`Match ${matchKey.matchKey} has not been scored yet.`);
    }

    const { site: matchDetailsSite, url: matchUrl } = await generateMatchDetailsUrl(matchKey);

    const matchUploaderAttribution = "Uploaded using https://github.com/gafirst/match-uploader";

    const redScore = matchInfo.alliances.red.score;
    const blueScore = matchInfo.alliances.blue.score;

    if (redScore === null) {
        throw new Error(
          `Match ${matchKey.matchKey} alliances.red.score property is null: ${JSON.stringify(matchInfo)}`,
        );
    }

    if (blueScore === null) {
        throw new Error(
          `Match ${matchKey.matchKey} alliances.blue.score property is null: ${JSON.stringify(matchInfo)}`,
        );
    }

    const redTeams = getTeamsInMatch(matchInfo.alliances.red.team_keys);
    const blueTeams = getTeamsInMatch(matchInfo.alliances.blue.team_keys);

    const view = {
        eventName,
        capitalizedVerboseMatchName: capitalizeFirstLetter(match.verboseMatchName),
        redTeams,
        blueTeams,
        redScore,
        blueScore,
        matchDetailsSite,
        matchUrl,
        matchUploaderAttribution,
    };

    return Mustache.render(templateString, view);
}
