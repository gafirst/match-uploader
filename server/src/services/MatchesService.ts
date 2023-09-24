import type MatchKey from "@src/models/MatchKey";
import { getFilesMatchingPattern } from "@src/repos/FileStorageRepo";
import { getSettings } from "@src/services/SettingsService";
import { Match } from "@src/models/Match";
import { capitalizeFirstLetter } from "@src/util/string";
import { MatchVideoInfo } from "@src/models/MatchVideoInfo";

export async function getRecommendedVideoFiles(matchKey: MatchKey): Promise<MatchVideoInfo[]> {
    const settings = await getSettings();
    const match = new Match(matchKey);
    const fullMatchName = capitalizeFirstLetter(match.verboseMatchName);

    const files = await getFilesMatchingPattern(settings.videoSearchDirectory, `${fullMatchName}*`);

    const parseVideoLabelsRegex = /^[A-Za-z]+ (Match )?\d{1,3}\s?([A-Za-z\s]*)\..*$/;

    return files.map((file) => {
        const proposedVideoLabel = parseVideoLabelsRegex.exec(file);

        if (proposedVideoLabel === null || proposedVideoLabel.length < 3 || proposedVideoLabel[2] === "") {
            return new MatchVideoInfo(file, null);
        }

        return new MatchVideoInfo(file, proposedVideoLabel[2]);
    });
}
