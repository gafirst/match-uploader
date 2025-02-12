import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import { IReq, IRes } from "@src/routes/types/types";
import { generateEventMediaVideoDescription, getEventMediaVideos } from "@src/services/EventMediaService";
import { matchedData, query, validationResult } from "express-validator";
import MatchKey from "@src/models/MatchKey";
import { getSettings } from "@src/services/SettingsService";
import { PlayoffsType } from "@src/models/PlayoffsType";
import { Match } from "@src/models/Match";

export const eventMediaRouter = Router();

eventMediaRouter.get(
  Paths.EventMedia.RecommendVideoFiles,
  query("mediaTitle").isString(),
  query("includeMatchVideos").default(false).isBoolean({strict: true}),
  recommendVideoFiles,
)

async function recommendVideoFiles(req: IReq, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const { mediaTitle, includeMatchVideos } = matchedData(req);

  res.json({
    ok: true,
    videoCandidates: await getEventMediaVideos(mediaTitle as string, includeMatchVideos as boolean),
  });
}

eventMediaRouter.get(
  Paths.Matches.GenerateDescription,
  query("mediaTitle").isString(),
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
  } = await getSettings();

  const { mediaTitle } = matchedData(req)

  res.json({
    ok: true,
    description: await generateEventMediaVideoDescription(mediaTitle as string, eventName),
  });
}
