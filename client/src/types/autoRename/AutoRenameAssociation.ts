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
  matchKey: string | null;
  videoLabel: string | null;
  newFileName: string | null;
  createdAt: string;
  updatedAt: string;
  renameJobId: string | null;
  renameAfter: string | null;
  renameCompleted: boolean;
  match: string | null;
  isIgnored: boolean;
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
  return typeof x === "object" &&
    x !== null &&
    "filePath" in x &&
    "status" in x &&
    isAutoRenameAssociationStatus(x.status) &&
    "statusReason" in x &&
    "videoTimestamp" in x &&
    "associationAttempts" in x &&
    "maxAssociationAttempts" in x &&
    "matchKey" in x &&
    "videoLabel" in x &&
    "renameJobId" in x &&
    "renameAfter" in x &&
    "renameCompleted" in x &&
    "newFileName" in x &&
    "createdAt" in x &&
    "updatedAt" in x &&
    "match" in x &&
    "isIgnored" in x;
}
