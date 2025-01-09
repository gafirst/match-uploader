import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import { type IReq, type IRes } from "@src/routes/types/types";
import {
  generateMatchVideoDescription,
  getLocalVideoFilesForMatch,
  getMatchList,
} from "@src/services/MatchesService";
import { matchedData, param, query, validationResult } from "express-validator";
import MatchKey from "@src/models/MatchKey";
import { type MatchVideoInfo } from "@src/models/MatchVideoInfo";
import { Match } from "@src/models/Match";
import { capitalizeFirstLetter } from "@src/util/string";
import { getSettings } from "@src/services/SettingsService";
import { PlayoffsType } from "@src/models/PlayoffsType";
import { getMatchUploadStatuses as getMatchUploadStatusesImpl } from "@src/services/MatchesService";
import { prisma } from "@src/server";

export const matchesRouter = Router();

matchesRouter.get(
  Paths.Matches.List,
  getEventMatchList,
);

async function getEventMatchList(req: IReq, res: IRes): Promise<void> {
  const { playoffsType: playoffsTypeRaw } = await getSettings();
  const playoffsType = playoffsTypeRaw as PlayoffsType;
  const matches = await getMatchList();
  matches.sort((a, b) => {
    const matchKeyA = MatchKey.fromString(a.key, playoffsType);
    const matchKeyB = MatchKey.fromString(b.key, playoffsType);
    return matchKeyA.compare(matchKeyB);
  });
  const matchList = matches.map((match) => {
    return {
      key: match.key,
      actualTime: match.actual_time,
      verboseName: capitalizeFirstLetter(
        new Match(
          MatchKey.fromString(match.key, playoffsType),
        ).matchName,
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
  query("isReplay", "isReplay must be a boolean").isBoolean().toBoolean(),
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

  const {
    matchKey,
    isReplay,
  } = matchedData(req);

  const { playoffsType: playoffsTypeRaw } = await getSettings();
  const playoffsType = playoffsTypeRaw as PlayoffsType;

  const matchKeyObject = MatchKey.fromString(matchKey as string, playoffsType);

  const recommendedVideoFiles = await getLocalVideoFilesForMatch(matchKeyObject, isReplay as boolean);
  res.json({
    ok: true,
    recommendedVideoFiles: recommendedVideoFiles.map((recommendation: MatchVideoInfo) => recommendation.toJson()),
  });
}

matchesRouter.get(
  Paths.Matches.GenerateDescription,
  param(
    "matchKey",
    "Match key is required and must pass a format test. (See MatchKey class for regex.)",
  ).isString().matches(MatchKey.matchKeyRegex),
  query("isReplay").default(false).isBoolean().toBoolean(),
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

  const {
    eventName,
    playoffsType,
  } = await getSettings();

  const { matchKey: matchKeyRaw, isReplay } = matchedData(req);
  const matchKey = MatchKey.fromString(matchKeyRaw as string, playoffsType as PlayoffsType);
  const match = new Match(matchKey, isReplay as boolean);

  res.json({
    ok: true,
    description: await generateMatchVideoDescription(match, eventName),
  });
}

matchesRouter.get(
  Paths.Matches.PossibleNextMatches,
  param(
    "matchKey",
    "Match key is required and must pass a format test. (See MatchKey class for regex.)",
  ).isString().matches(MatchKey.matchKeyRegex),
  getPossibleNextMatches,
);

async function getPossibleNextMatches(req: IReq, res: IRes): Promise<IRes> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400)
      .json({
        errors: errors.array(),
      });
  }

  const { playoffsType } = await getSettings();

  if ((playoffsType as PlayoffsType) !== PlayoffsType.DoubleElimination) {
    return res.status(400)
      .json({
        errors: "Possible next matches are only available for double elimination playoffs mode",
      });
  }

  const { matchKey: matchKeyRaw } = matchedData(req);
  const matchKey = MatchKey.fromString(matchKeyRaw as string, playoffsType as PlayoffsType);

  const nextMatchSameLevel = matchKey.nextMatchInSameCompLevel.matchKey;

  const firstMatchNextLevel = matchKey.firstMatchInNextCompLevel?.matchKey ?? null;

  return res.json({
    ok: true,
    sameLevel: nextMatchSameLevel,
    nextLevel: firstMatchNextLevel,
  });
}

matchesRouter.get(
  Paths.Matches.UploadStatuses,
  getMatchUploadStatuses,
);

async function getMatchUploadStatuses(req: IReq, res: IRes): Promise<void> {
  res.json({
    ok: true,
    ...(await getMatchUploadStatusesImpl(prisma)),
  });
}
