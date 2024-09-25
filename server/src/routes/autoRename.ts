import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import type { IReq, IRes } from "@src/routes/types/types";
import { prisma } from "@src/server";
import MatchKey from "@src/models/MatchKey";
import { getSettings } from "@src/services/SettingsService";
import { type PlayoffsType } from "@src/models/PlayoffsType";
import { Match } from "@src/models/Match";
import { body, matchedData, query, validationResult } from "express-validator";
import { type AutoRenameAssociationStatus } from "@prisma/client";
import { markAssociationIgnored, updateAssociationData } from "@src/services/AutoRenameService";

export const autoRenameRouter = Router();

export const autoRenameAssociationsRouter = Router();
autoRenameRouter.use(Paths.AutoRename.Associations.Base, autoRenameAssociationsRouter);

autoRenameAssociationsRouter.get(
  Paths.AutoRename.Associations.List,
  query("status")
    .optional()
    .toUpperCase()
    .isIn(["UNMATCHED", "STRONG", "WEAK", "FAILED"])
    .withMessage("Status must be one of UNMATCHED, STRONG, WEAK, FAILED"),
  getAutoRenameAssociations,
);

async function getAutoRenameAssociations(req: IReq, res: IRes): Promise<void> {
  const { playoffsType } = await getSettings();
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const {
    status,
  } = matchedData(req);

  const where = status
    ? {
      status: status as AutoRenameAssociationStatus,
    }
    : undefined;

  const associations = await prisma.autoRenameAssociation.findMany(
    {
      where,
    },
  );
  const associationsWithMatchNames = associations.map((association) => {
    if (!association.matchKey) {
      return {
        ...association,
        match: null,
      };
    }
    const matchKey = MatchKey.fromString(association.matchKey, playoffsType as PlayoffsType);
    const match = new Match(matchKey);

    return {
      ...association,
      match: match.matchName,
    };
  });

  res.json({
    ok: true,
    associations: associationsWithMatchNames,
  });
}

autoRenameAssociationsRouter.put(
  Paths.AutoRename.Associations.Confirm,
  body("videoLabel").isString().notEmpty(),
  body("filePath").isString().notEmpty(),
  body("matchKey").optional().isString().notEmpty(),
  updateAssociation,
);

async function updateAssociation(req: IReq, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const {
    videoLabel,
    filePath,
    matchKey,
  } = matchedData(req);

  const error = await updateAssociationData(videoLabel as string,
    filePath as string,
    matchKey as string | null,
  );

  res.status(error ? 400 : 200).json({
    ok: !error,
    message: error,
  });
}

autoRenameAssociationsRouter.put(
  Paths.AutoRename.Associations.Ignore,
  body("videoLabel").isString().notEmpty(),
  body("filePath").isString().notEmpty(),
  ignoreAssociation,
);

async function ignoreAssociation(req: IReq, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const {
    videoLabel,
    filePath,
  } = matchedData(req);

  const error = await markAssociationIgnored(videoLabel as string, filePath as string);

  res.json({
    ok: !error,
    message: error,
  });
}
