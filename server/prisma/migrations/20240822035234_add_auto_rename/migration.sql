-- CreateEnum
CREATE TYPE "AutoRenameAssociationStatus" AS ENUM ('UNMATCHED', 'FAILED', 'WEAK', 'STRONG');

-- CreateTable
CREATE TABLE "AutoRenameAssociation" (
    "id" SERIAL NOT NULL,
    "videoFile" TEXT NOT NULL,
    "status" "AutoRenameAssociationStatus" NOT NULL DEFAULT 'UNMATCHED',
    "statusReason" TEXT,
    "associationAttempts" INTEGER NOT NULL DEFAULT 0,
    "matchKey" TEXT NOT NULL,
    "videoLabel" TEXT NOT NULL,
    "renameCompleted" BOOLEAN NOT NULL DEFAULT false,
    "oldFileName" TEXT NOT NULL,
    "newFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoRenameAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoRenameMetadata" (
    "id" SERIAL NOT NULL,
    "eventKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lastAssociatedMatchKey" TEXT,
    "eventStart" TIMESTAMP(3) NOT NULL,
    "eventEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoRenameMetadata_pkey" PRIMARY KEY ("id")
);
