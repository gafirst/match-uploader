import type MatchKey from "@src/models/MatchKey";
import {getFilesMatchingPattern} from "@src/repos/FileStorageRepo";
import {getSecrets, getSettings} from "@src/services/SettingsService";
import {Match} from "@src/models/Match";
import {capitalizeFirstLetter} from "@src/util/string";
import {MatchVideoInfo} from "@src/models/MatchVideoInfo";
import {type TbaMatchSimple} from "@src/models/theBlueAlliance/tbaMatchesSimpleApiResponse";
import {TheBlueAllianceReadRepo} from "@src/repos/TheBlueAllianceReadRepo";
import dedent from "dedent";
import {type TbaFrcTeam} from "@src/models/theBlueAlliance/tbaFrcTeam";

export async function getLocalVideoFilesForMatch(matchKey: MatchKey): Promise<MatchVideoInfo[]> {
    const settings = await getSettings();
    const match = new Match(matchKey);
    const videoFileMatchingName = capitalizeFirstLetter(match.videoFileMatchingName);
    const matchTitleName = capitalizeFirstLetter(match.verboseMatchName);
    const eventName = settings.eventName;

    const files = await getFilesMatchingPattern(settings.videoSearchDirectory, `${videoFileMatchingName}*`);
    const parseVideoLabelsRegex = /^[A-Za-z]+ (Match )?(\d{1,3})\s?([A-Za-z\s]*)\..*$/;

    return files.filter(file => {
        const proposedVideoLabel = parseVideoLabelsRegex.exec(file);

        // Filter out this file if the pattern is incorrect
        if (!proposedVideoLabel || proposedVideoLabel.length < 4) {
            return false;
        }

        // Pulls the actual match number out of the file name using the 2nd capture group in parseVideoLabelsRegex
        const fileMatchNumber = proposedVideoLabel[2];

        // Filter out this file if the match number in the file name doesn't match the match we want to get videos for
        if (!fileMatchNumber || Number.parseInt(fileMatchNumber, 10) !== match.key.matchNumber) {
            return false;
        }

        return true;
    }).map((file) => {
        const proposedVideoLabel = parseVideoLabelsRegex.exec(file);
        let videoLabel: string | null = null;
        let videoTitle: string;

        if (proposedVideoLabel !== null && proposedVideoLabel.length >= 4 && proposedVideoLabel[3] !== "") {
            videoLabel = proposedVideoLabel[3];
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

export async function getTbaMatch(matchKey: MatchKey): Promise<TbaMatchSimple> {
    const { theBlueAllianceReadApiKey } = await getSecrets();
    const tba = new TheBlueAllianceReadRepo(theBlueAllianceReadApiKey);

    return await tba.getMatchResults(matchKey);
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

export async function generateMatchVideoDescription(match: Match, eventName: string): Promise<string> {
    const matchKey = match.key;
    const matchInfo = await getTbaMatch(matchKey);

    if (!matchIsScored(matchInfo)) {
        throw new Error(`Match ${matchKey.matchKey} has not been scored yet.`);
    }

    const matchTbaUrl = `https://www.thebluealliance.com/match/${matchKey.matchKey}`;
    // TODO: Don't hardcode references to GAFIRST
    const footageSource = `Footage of the ${eventName} is provided by the GeorgiaFIRST A/V Team.`;
    const socialMedia = "Follow us on Twitter (@GeorgiaFIRST) and Facebook " +
        "(GeorgiaRobotics). For more information and future event schedules, visit our website: https://gafirst.org";
    const matchUploaderAttribution = `Uploaded using https://github.com/gafirst/match-uploader`;

    // TODO: these really shouldn't be null because of the score check above. but we also really shouldn't render "null"
    const redScore = matchInfo.alliances.red.score;
    const blueScore = matchInfo.alliances.blue.score;

    const redTeams = getTeamsInMatch(matchInfo.alliances.red.team_keys);
    const blueTeams = getTeamsInMatch(matchInfo.alliances.blue.team_keys);

    // https://github.com/gafirst/match-uploader/issues/18
    // TODO: We really shouldn't hardcode this here. The issue above will fix that.
    return dedent`${eventName} - ${capitalizeFirstLetter(match.verboseMatchName)}
    
    Red (teams ${redTeams}) - ${redScore}
    Blue (teams ${blueTeams}) - ${blueScore}
    
    View this match on The Blue Alliance: ${matchTbaUrl}
    
    ${footageSource}
    
    ${socialMedia}

    ${matchUploaderAttribution}`;
}
