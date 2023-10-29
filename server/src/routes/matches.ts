import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import { type IReq, type IRes } from "@src/routes/types/types";
import {
    generateMatchVideoDescription,
    getLocalVideoFilesForMatch,
    getMatchList,
} from "@src/services/MatchesService";
import { matchedData, param, validationResult } from "express-validator";
import MatchKey from "@src/models/MatchKey";
import { type MatchVideoInfo } from "@src/models/MatchVideoInfo";
import { Match } from "@src/models/Match";
import { capitalizeFirstLetter } from "@src/util/string";
import { getSettings } from "@src/services/SettingsService";
import { type PlayoffsType } from "@src/models/PlayoffsType";

export const matchesRouter = Router();

matchesRouter.get(
    Paths.Matches.List,
    getEventMatchList,
);

async function getEventMatchList(req: IReq, res: IRes): Promise<void> {
    const { playoffsType: playoffsTypeRaw } = await getSettings();
    const playoffsType = playoffsTypeRaw as PlayoffsType;

    const matchList = (await getMatchList()).map((match) => {
        return {
            key: match.key,
            verboseName: capitalizeFirstLetter(
                new Match(
                    MatchKey.fromString(match.key, playoffsType),
                ).verboseMatchName,
            ),
        };
    });

    res.json({
        ok: true,
        matches: matchList,
    });
}

matchesRouter.get(
    Paths.Matches.RecommendVideoFiles,
    param(
        "matchKey",
        "Match key is required and must pass a format test. (See MatchKey class for regex.)",
    ).isString().matches(MatchKey.matchKeyRegex),
    recommendVideoFiles,
);

async function recommendVideoFiles(req: IReq, res: IRes): Promise<void> {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400)
            .json({
                errors: errors.array(),
            });
        return;
    }

    const { matchKey } = matchedData(req);

    const { playoffsType: playoffsTypeRaw } = await getSettings();
    const playoffsType = playoffsTypeRaw as PlayoffsType;

    const matchKeyObject = MatchKey.fromString(matchKey as string, playoffsType);

    const recommendedVideoFiles = await getLocalVideoFilesForMatch(matchKeyObject);
    res.json({
        ok: true,
        recommendedVideoFiles: recommendedVideoFiles.map((recommendation: MatchVideoInfo) => recommendation.toJson()),
    });
}

// generate description GET endpoint
matchesRouter.get(
    Paths.Matches.GenerateDescription,
    param(
        "matchKey",
        "Match key is required and must pass a format test. (See MatchKey class for regex.)",
    ).isString().matches(MatchKey.matchKeyRegex),
    generateDescription,
);

async function generateDescription(req: IReq, res: IRes): Promise<void> {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400)
            .json({
                errors: errors.array(),
            });
        return;
    }

    const { eventName, playoffsType } = await getSettings();
    const { matchKey: matchKeyRaw } = matchedData(req);
    const matchKey = MatchKey.fromString(matchKeyRaw as string, playoffsType as PlayoffsType);
    const match = new Match(matchKey);
    res.json({
        ok: true,
        description: await generateMatchVideoDescription(match, eventName),
    });
}
