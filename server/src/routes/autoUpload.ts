import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import { body, matchedData, validationResult } from "express-validator";
import MatchKey from "@src/models/MatchKey";
import { IReq, IRes } from "@src/routes/types/types";
import { enableAutoUpload as enableAutoUploadImpl } from "@src/services/AutoUploadService";
import { getSettings } from "@src/services/SettingsService";
import { PlayoffsType } from "@src/models/PlayoffsType";

export const autoUploadRouter = Router();

autoUploadRouter.post(
  Paths.AutoUpload.Enable,
  body("startingMatchKey", "Starting match key is required and must pass a format test. (See MatchKey class for regex.)")
    .isString()
    .matches(MatchKey.matchKeyRegex),
  enableAutoUpload,
)

async function enableAutoUpload(req: IReq, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const {
    startingMatchKey,
  } = matchedData(req);

  const { playoffsType } = await getSettings();

  const startingMatchKeyObj = MatchKey.fromString(startingMatchKey, playoffsType as PlayoffsType)

  const result = await enableAutoUploadImpl(startingMatchKeyObj)

  res.json({
    ok: true,
    enabled: result.enabled,
    unmetPrereqs: result.unmetPrereqs,
  });
}