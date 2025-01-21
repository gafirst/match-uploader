/*
  Warnings:

  - The primary key for the `AutoRenameAssociation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[eventKey,filePath]` on the table `AutoRenameAssociation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventKey` to the `AutoRenameAssociation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AutoRenameAssociation_filePath_key";

-- AlterTable
ALTER TABLE "AutoRenameAssociation" DROP CONSTRAINT "AutoRenameAssociation_pkey",
ADD COLUMN "eventKey" TEXT NOT NULL DEFAULT 'legacy_no_event_key';

UPDATE "AutoRenameAssociation" SET "eventKey" = 'legacy_no_event_key' WHERE "eventKey" IS NULL;
ALTER TABLE "AutoRenameAssociation" ALTER COLUMN "eventKey" DROP DEFAULT,

ADD CONSTRAINT "AutoRenameAssociation_pkey" PRIMARY KEY ("eventKey", "filePath");

-- CreateIndex
CREATE UNIQUE INDEX "AutoRenameAssociation_eventKey_filePath_key" ON "AutoRenameAssociation"("eventKey", "filePath");
