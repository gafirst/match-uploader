import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import { IReq, IRes } from "@src/routes/types/types";
import {
  generateEventMediaVideoDescription,
  getEventMediaVideoFiles,
  getEventMediaVideos,
} from "@src/services/EventMediaService";
import { body, matchedData, query, validationResult } from "express-validator";
import { getSettings } from "@src/services/SettingsService";

export const eventMediaRouter = Router();

eventMediaRouter.get(
  Paths.EventMedia.RecommendVideoFiles,
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

  res.json({
    ok: true,
    videoFiles: await getEventMediaVideoFiles()
  });
}

eventMediaRouter.post(
  Paths.EventMedia.GetVideoMetadata,
  body("paths").isArray({ min: 1 }),
  body("mediaTitle").isString(),
  getVideoMetadata,
)

async function getVideoMetadata(req: IReq, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const { paths, mediaTitle } = matchedData(req);

  res.json({
    ok: true,
    videoCandidates: await getEventMediaVideos(paths, mediaTitle),
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
