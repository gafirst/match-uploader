import {
  AutoRenameAssociationStatus,
  isAutoRenameAssociationStatus,
} from "@/types/autoRename/AutoRenameAssociationStatus";

export interface AutoRenameAssociationApiResponse {
  ok: boolean;
  associations: AutoRenameAssociation[];
}

export interface AutoRenameAssociation {
  filePath: string;
  videoFile: string;
  status: AutoRenameAssociationStatus;
  statusReason: string | null;
  videoTimestamp: string | null;
  associationAttempts: number;
  maxAssociationAttempts: number;
  matchKey: string;
  videoLabel: string | null;
  newFileName: string | null;
  createdAt: string;
  updatedAt: string;
  renameJobId: string | null;
  renameAfter: string | null;
  renameCompleted: boolean;
  match?: string | null;
  isIgnored: boolean;
  videoDurationSecs: number | null;
  startTimeDiffSecs: number | null;
  startTimeDiffAbnormal: boolean | null;
  videoDurationAbnormal: boolean | null;
  orderingIssueMatchKey: string | null;
  orderingIssueMatchName: string | null;
}

export function isAutoRenameAssociationApiResponse(x: unknown): x is AutoRenameAssociationApiResponse {
  return x !== null &&
    typeof x === "object" &&
    (x as AutoRenameAssociationApiResponse).ok !== undefined &&
    (x as AutoRenameAssociationApiResponse).associations !== undefined &&
    Array.isArray((x as AutoRenameAssociationApiResponse).associations) &&
    (x as AutoRenameAssociationApiResponse).associations.every(isAutoRenameAssociation);
}

export function isAutoRenameAssociation(x: unknown): x is AutoRenameAssociation {
  console.log("isAutoRenameAssociation payload", x, typeof x === "object" );
  console.log("filePath", x.filePath, "filePath" in x);
  console.log("status", x.status, "status" in x && isAutoRenameAssociationStatus(x.status));
  console.log("statusReason", x.statusReason, "statusReason" in x);
  console.log("videoTimestamp", x.videoTimestamp, "videoTimestamp" in x);
  console.log("associationAttempts", x.associationAttempts, "associationAttempts" in x);
  console.log("maxAssociationAttempts", x.maxAssociationAttempts, "maxAssociationAttempts" in x);
  console.log("matchKey", x.matchKey, "matchKey" in x);
  console.log("videoLabel", x.videoLabel, "videoLabel" in x);
  console.log("renameJobId", x.renameJobId, "renameJobId" in x);
  console.log("renameAfter", x.renameAfter, "renameAfter" in x);
  console.log("renameCompleted", x.renameCompleted, "renameCompleted" in x);
  console.log("newFileName", x.newFileName, "newFileName" in x);
  console.log("createdAt", x.createdAt, "createdAt" in x);
  console.log("updatedAt", x.updatedAt, "updatedAt" in x);
  console.log("match", x.match, "match" in x);
  console.log("matchName", x.matchName, "matchName" in x);
  console.log("isIgnored", x.isIgnored, "isIgnored" in x);
  console.log("videoDurationSecs", x.videoDurationSecs, "videoDurationSecs" in x);
  console.log("startTimeDiffSecs", x.startTimeDiffSecs, "startTimeDiffSecs" in x);
  console.log("startTimeDiffAbnormal", x.startTimeDiffAbnormal, "startTimeDiffAbnormal" in x);
  console.log("videoDurationAbnormal", x.videoDurationAbnormal, "videoDurationAbnormal" in x);
  console.log("orderingIssueMatchKey", x.orderingIssueMatchKey, "orderingIssueMatchKey" in x);
  console.log("orderingIssueMatchName", x.orderingIssueMatchName, "orderingIssueMatchName" in x);

  return typeof x === "object" &&
    "filePath" in x &&
    "status" in x &&
    isAutoRenameAssociationStatus(x.status) &&
    "statusReason" in x &&
    "videoTimestamp" in x &&
    "associationAttempts" in x &&
    "maxAssociationAttempts" in x &&
    "videoLabel" in x &&
    "renameJobId" in x &&
    "renameAfter" in x &&
    "renameCompleted" in x &&
    "newFileName" in x &&
    "createdAt" in x &&
    "updatedAt" in x &&
    "matchKey" in x &&
    "matchName" in x &&
    "videoDurationSecs" in x &&
    "startTimeDiffSecs" in x &&
    "startTimeDiffAbnormal" in x &&
    "videoDurationAbnormal" in x &&
    "orderingIssueMatchKey" in x &&
    "orderingIssueMatchName" in x;
}

export const AUTO_RENAME_ASSOCIATION_UPDATE = "autorename:association:update";
export type AutoRenameEvent  = typeof AUTO_RENAME_ASSOCIATION_UPDATE;

export interface AutoRenameEvents<EventName extends AutoRenameEvent> {
  event: EventName;
  association: AutoRenameAssociation;
}
