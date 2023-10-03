import type MatchKey from "@src/models/MatchKey";
import {getFilesMatchingPattern} from "@src/repos/FileStorageRepo";
import {getSecrets, getSettings} from "@src/services/SettingsService";
import {Match} from "@src/models/Match";
import {capitalizeFirstLetter} from "@src/util/string";
import {MatchVideoInfo} from "@src/models/MatchVideoInfo";
import {type TbaMatchSimple} from "@src/models/theBlueAlliance/tbaMatchSimpleApiResponse";
import {TheBlueAllianceReadRepo} from "@src/repos/TheBlueAllianceReadRepo";

export async function getLocalVideoFilesForMatch(matchKey: MatchKey): Promise<MatchVideoInfo[]> {
    const settings = await getSettings();
    const match = new Match(matchKey);
    const fullMatchName = capitalizeFirstLetter(match.verboseMatchName);
    const eventName = settings.eventName;

    const files = await getFilesMatchingPattern(settings.videoSearchDirectory, `${fullMatchName}*`);
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
            videoTitle = `${fullMatchName} - ${eventName}`;
        } else {
            videoTitle = `${fullMatchName} - ${videoLabel} - ${eventName}`;
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
