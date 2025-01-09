import type MatchKey from "@src/models/MatchKey";
import { getFilesMatchingPattern } from "@src/repos/FileStorageRepo";
import { getDescriptionTemplate, getSecrets, getSettings, getYouTubePlaylists } from "@src/services/SettingsService";
import { Match } from "@src/models/Match";
import { capitalizeFirstLetter } from "@src/util/string";
import { MatchVideoInfo } from "@src/models/MatchVideoInfo";
import { type TbaMatchSimple } from "@src/models/theBlueAlliance/tbaMatchesSimpleApiResponse";
import { TheBlueAllianceReadRepo } from "@src/repos/TheBlueAllianceReadRepo";
import { type TbaFrcTeam } from "@src/models/theBlueAlliance/tbaFrcTeam";
import { FrcEventsRepo } from "@src/repos/FrcEventsRepo";
import { PlayoffsType } from "@src/models/PlayoffsType";
import { getFrcApiMatchNumber } from "@src/models/frcEvents/frcScoredMatch";
import { toFrcEventsUrlTournamentLevel } from "@src/models/CompLevel";
import Mustache from "mustache";

import {
    getEventUploadStatusByMatch,
} from "@src/repos/UploadedVideosRepo";

import { EventUploadStatusByMatch } from "@src/models/UploadedVideo";
import { type PrismaClient } from "@prisma/client";
import { type WorkerPrismaClient } from "@src/worker";

export async function getLocalVideoFilesForMatch(matchKey: MatchKey, isReplay: boolean): Promise<MatchVideoInfo[]> {
    const { eventName, videoSearchDirectory } = await getSettings();
    const match = new Match(matchKey, isReplay);
    const videoFileMatchingName = capitalizeFirstLetter(match.videoFileMatchingName);
    const matchTitleName = capitalizeFirstLetter(match.verboseMatchName);

    const files = await getFilesMatchingPattern(
      videoSearchDirectory,
      `**/${videoFileMatchingName}.*`,
      2,
      false,
    );
    const uploadedFiles = await getFilesMatchingPattern(
      videoSearchDirectory,
      `**/uploaded/${videoFileMatchingName}.*`,
      3,
      false,
    );

    files.push(...uploadedFiles);
    return files
      .filter(filePath => filePath.includes("/")) // Files must be within a subdirectory
      .map(filePath => {
        // Video label is the first part of the file path
        const proposedVideoLabel = filePath.split("/")[0];
        let videoLabel: string | null = null;
        let videoTitle: string;

        // Don't set a video label if the proposed label name is "unlabeled" (case-insensitive)
        if (proposedVideoLabel.toLowerCase() !== "unlabeled") {
            videoLabel = proposedVideoLabel;
        }

        if (!videoLabel) {
            videoTitle = `${matchTitleName} - ${eventName}`;
        } else {
            videoTitle = `${matchTitleName} - ${videoLabel} - ${eventName}`;
        }

        const isUploaded = filePath.includes("uploaded");

        return new MatchVideoInfo(filePath, videoLabel, videoTitle, isUploaded);
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
    // Remove "frc" from "frc1234" to get "1234"
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

export async function getMatchUploadStatuses(
  prisma: PrismaClient | WorkerPrismaClient,
): Promise<EventUploadStatusByMatch> {
    const { eventTbaCode, playoffsType } = await getSettings();
    const playlists = await getYouTubePlaylists();

    return await getEventUploadStatusByMatch(
      prisma,
      eventTbaCode,
      new Set(Object.keys(playlists)),
      playoffsType as PlayoffsType,
      await getMatchList(),
    );
}
