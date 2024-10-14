-- CreateEnum
CREATE TYPE "AutoRenameAssociationStatus" AS ENUM ('UNMATCHED', 'FAILED', 'WEAK', 'STRONG', 'IGNORED');

-- CreateTable
CREATE TABLE "AutoRenameAssociation" (
    "filePath" TEXT NOT NULL,
    "videoFile" TEXT NOT NULL,
    "status" "AutoRenameAssociationStatus" NOT NULL DEFAULT 'UNMATCHED',
    "statusReason" TEXT,
    "videoTimestamp" TIMESTAMP(3),
    "startTimeDiffSecs" INTEGER,
    "videoDurationSecs" INTEGER,
    "startTimeDiffAbnormal" BOOLEAN,
    "videoDurationAbnormal" BOOLEAN,
    "orderingIssueMatchKey" TEXT,
    "orderingIssueMatchName" TEXT,
    "associationAttempts" INTEGER NOT NULL DEFAULT 0,
    "maxAssociationAttempts" INTEGER NOT NULL DEFAULT 5,
    "matchKey" TEXT,
    "matchName" TEXT,
    "videoLabel" TEXT NOT NULL,
    "renameAfter" TIMESTAMP(3),
    "renameJobId" TEXT,
    "renameCompleted" BOOLEAN NOT NULL DEFAULT false,
    "newFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoRenameAssociation_pkey" PRIMARY KEY ("filePath")
);

-- CreateTable
CREATE TABLE "AutoRenameMetadata" (
    "eventKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lastStrongAssociationMatchKey" TEXT,
    "lastStrongAssociationMatchName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoRenameMetadata_pkey" PRIMARY KEY ("eventKey","label")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutoRenameAssociation_filePath_key" ON "AutoRenameAssociation"("filePath");
