import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import { type IReq, type IRes } from "@src/routes/types/types";
import {
  getObfuscatedSecrets,
  getSettings,
  getDescriptionTemplate as settingsServiceGetDescriptionTemplate,
  setDescriptionTemplate,
  setSecret,
  setSetting,
} from "@src/services/SettingsService";
import { body, matchedData, param, validationResult } from "express-validator";
import { type ISecretSettings, type ISettings } from "@src/models/Settings";

export const settingsRouter = Router();

settingsRouter.get(
  Paths.Settings.List,
  listSettings,
);

async function listSettings(req: IReq, res: IRes): Promise<void> {
  res.json(await getSettings());
}

settingsRouter.get(
    Paths.Settings.ListSecrets,
    listSecrets,
);

async function listSecrets(req: IReq, res: IRes): Promise<void> {
  res.json(await getObfuscatedSecrets());
}

settingsRouter.post(
  Paths.Settings.Update,
  param("name", "Setting name to be updated is required and must be a string").isString(),
  body("value", "New setting value is required and must be non-null").exists({ checkNull: true }).trim(),
  body("settingType", "Type must be 'setting' or 'secret' to indicate desired storage location")
    .isIn(["setting", "secret"])
    .trim(),
  updateSetting,
);

async function updateSetting(req: IReq<{ value: string }>, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const { name, value, settingType } = matchedData(req);

  if (settingType === "secret") {
    await setSecret(name as keyof ISecretSettings, value as string);
  } else {
    await setSetting(name as keyof ISettings, value as string);
  }

  res.json({
    ok: true,
  });
}

settingsRouter.get(
    Paths.Settings.DescriptionTemplate,
    getDescriptionTemplate,
);

async function getDescriptionTemplate(req: IReq, res: IRes): Promise<void> {
  const descriptionTemplate = await settingsServiceGetDescriptionTemplate();
  res.json({
    descriptionTemplate,
  });
}

settingsRouter.post(
  Paths.Settings.DescriptionTemplate,
  body("descriptionTemplate", "Description template is required and must be a string").isString().trim(),
  updateDescriptionTemplate,
);

async function updateDescriptionTemplate(req: IReq, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const { descriptionTemplate } = matchedData(req);
  await setDescriptionTemplate(descriptionTemplate as string);

  res.json({
    ok: true,
  });
}
