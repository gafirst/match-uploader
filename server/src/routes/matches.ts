import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import { type IReq, type IRes } from "@src/routes/types/types";
import { getLocalVideoFilesForMatch, getTbaMatchList } from "@src/services/MatchesService";
import { matchedData, param, validationResult } from "express-validator";
import MatchKey from "@src/models/MatchKey";
import { type MatchVideoInfo } from "@src/models/MatchVideoInfo";

export const matchesRouter = Router();

matchesRouter.get(
    Paths.Matches.List,
    getMatchList,
);

async function getMatchList(req: IReq, res: IRes): Promise<void> {
    res.json(await getTbaMatchList());
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
    const matchKeyObject = MatchKey.fromString(matchKey as string);

    const recommendedVideoFiles = await getLocalVideoFilesForMatch(matchKeyObject);
    res.json({
        ok: true,
        recommendedVideoFiles: recommendedVideoFiles.map((recommendation: MatchVideoInfo) => recommendation.toJson()),
    });
}
