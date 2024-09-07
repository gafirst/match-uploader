import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import type { IReq, IRes } from "@src/routes/types/types";
import { prisma } from "@src/server";
import MatchKey from "@src/models/MatchKey";
import { getSettings } from "@src/services/SettingsService";
import { type PlayoffsType } from "@src/models/PlayoffsType";
import { Match } from "@src/models/Match";
import { matchedData, query, validationResult } from "express-validator";
import { type AutoRenameAssociationStatus } from "@prisma/client";

export const autoRenameRouter = Router();

export const autoRenameAssociationsRouter = Router();
autoRenameRouter.use(Paths.AutoRename.Associations.Base, autoRenameAssociationsRouter);

autoRenameAssociationsRouter.get(
  Paths.AutoRename.Associations.List,
  query("status")
    .optional()
    .toUpperCase()
    .isIn(["STRONG", "WEAK", "FAILED", "PENDING"])
    .withMessage("Status must be one of STRONG, WEAK, FAILED, PENDING"),
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
    if (!association.matchKey) return association;
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
